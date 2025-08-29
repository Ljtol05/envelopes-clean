#!/usr/bin/env node
// Minimal HTTP MCP server wrapper that proxies to configured base URLs
// Reads BASE_URLS and HEADERS_* from env and exposes GET/POST tools.
// No need for node:http here; using global fetch

// Very small stdio-based MCP-ish protocol for Copilot Chat compatibility:
// We'll implement a simple JSON-RPC loop over stdio: receive a request with
// method "tools/list" or "tools/call".

const BASES = process.env.BASE_URLS || '';
// Parse BASE_URLS in the form NAME=url;NAME2=url2
function parseBases(s) {
  const map = {};
  s.split(';').forEach(pair => {
    const [k, v] = pair.split('=');
    if (k && v) map[k.trim()] = v.trim();
  });
  // Prefer VITE_API_URL if provided via API or API_LEGACY
  if (map.API_LEGACY && !map.API && !map.API?.length) {
    map.API = map.API_LEGACY;
  }
  return map;
}

function parseHeaders(prefix) {
  // HEADERS_API like: "Authorization=Bearer TOKEN;X-Other=foo"
  const raw = process.env[`HEADERS_${prefix}`] || '';
  const headers = {};
  raw.split(';').forEach(pair => {
    const [k, v] = pair.split('=');
    if (k && v) headers[k.trim()] = v.trim();
  });
  return headers;
}

const bases = parseBases(BASES);
const headersByKey = {
  API: parseHeaders('API'),
  HEALTH: parseHeaders('HEALTH'),
};

function makeUrl(baseKey, path) {
  const base = bases[baseKey];
  if (!base) throw new Error(`BASE_URL not set for ${baseKey}`);
  return base.replace(/\/$/, '') + (path.startsWith('/') ? path : '/' + path);
}

async function httpCall(method, url, body, headers={}) {
  const res = await fetch(url, {
    method,
    headers: { 'Content-Type': 'application/json', ...headers },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  let parsed;
  try { parsed = JSON.parse(text); } catch { parsed = text; }
  return { status: res.status, ok: res.ok, headers: Object.fromEntries(res.headers.entries()), body: parsed };
}

const tools = [
  {
    name: 'http.get',
    description: 'GET from a configured base key (API or HEALTH)',
    inputSchema: {
      type: 'object',
      properties: {
        baseKey: { type: 'string', enum: Object.keys(bases).length ? Object.keys(bases) : ['API','HEALTH'] },
        path: { type: 'string' },
        headers: { type: 'object', additionalProperties: { type: 'string' } }
      },
      required: ['baseKey','path']
    }
  },
  {
    name: 'http.post',
    description: 'POST JSON to a configured base key (API)',
    inputSchema: {
      type: 'object',
      properties: {
        baseKey: { type: 'string', enum: Object.keys(bases).length ? Object.keys(bases) : ['API'] },
        path: { type: 'string' },
        body: { type: 'object' },
        headers: { type: 'object', additionalProperties: { type: 'string' } }
      },
      required: ['baseKey','path']
    }
  }
];

// Minimal JSON-RPC over stdio
function respond(id, result, error) {
  const payload = { jsonrpc: '2.0', id, ...(error ? { error } : { result }) };
  const str = JSON.stringify(payload);
  process.stdout.write(str + '\n');
}

let buf = '';
process.stdin.setEncoding('utf8');
process.stdin.on('data', async chunk => {
  buf += chunk;
  let idx;
  while ((idx = buf.indexOf('\n')) >= 0) {
    const line = buf.slice(0, idx);
    buf = buf.slice(idx + 1);
    if (!line.trim()) continue;
    let req;
  try { req = JSON.parse(line); } catch {
      continue;
    }
    const { id, method, params } = req;
    try {
      if (method === 'initialize') {
        respond(id, { protocolVersion: '2024-11-05', serverInfo: { name: 'simple-http-mcp', version: '0.1.0' } });
      } else if (method === 'tools/list') {
        respond(id, { tools });
      } else if (method === 'tools/call') {
        const { name, arguments: args } = params || {};
        if (name === 'http.get') {
          const baseKey = args.baseKey || 'API';
          const url = makeUrl(baseKey, args.path);
          const resp = await httpCall('GET', url, undefined, { ...headersByKey[baseKey], ...(args.headers||{}) });
          respond(id, { content: [{ type: 'text', text: JSON.stringify(resp, null, 2) }] });
        } else if (name === 'http.post') {
          const baseKey = args.baseKey || 'API';
          const url = makeUrl(baseKey, args.path);
          const resp = await httpCall('POST', url, args.body || {}, { ...headersByKey[baseKey], ...(args.headers||{}) });
          respond(id, { content: [{ type: 'text', text: JSON.stringify(resp, null, 2) }] });
        } else {
          respond(id, undefined, { code: -32601, message: 'Unknown tool' });
        }
      } else if (method === 'shutdown') {
        respond(id, {});
        process.exit(0);
      } else {
        respond(id, undefined, { code: -32601, message: 'Unknown method' });
      }
    } catch (e) {
      respond(id, undefined, { code: -32000, message: e.message || String(e) });
    }
  }
});
