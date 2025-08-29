# MCP setup for Copilot Chat

This workspace is configured to let GitHub Copilot Chat:
- Run whitelisted terminal commands (via a Shell MCP server)
- Call your HTTP API (via a minimal HTTP MCP server script)

## Servers

- Shell MCP: runs only allowlisted commands like npm, vite, jest, vitest, eslint, git, curl, etc.
- HTTP MCP: exposes simple tools to GET/POST against your configured API base URLs.

## Environment resolution

The HTTP server reads BASE_URLS and HEADERS_* from the editor environment via VS Code expansion in `.vscode/settings.json`.

Set these in `.env.local` (or your user shell env):
- VITE_API_URL (preferred) or VITE_API_BASE_URL (legacy)
- VITE_HEALTH_BASE_URL (optional; falls back to VITE_API_URL)
- VITE_API_TOKEN (optional Authorization header). For MCP, use a Service Account token created on the backend.

Service Account token guidance:
- Create a service account in your backend (as shown in the screenshots) with minimal `mcp:read`/`api:read` permissions needed.
- Use the provided token that starts with `sa_...` in `VITE_API_TOKEN`.
- The MCP HTTP server then sets an Authorization header automatically: `Authorization: Bearer ${env:VITE_API_TOKEN}`.

No secrets are committed. Only environment variable names are referenced.

## Safety

- Shell allowlist prevents arbitrary execution.
- No filesystem or database MCP servers added.

## Usage checklist

- Use the shell server to run `npm run test` and summarize failures by file/function. Propose minimal code changes and re-run tests until green.
- Use the shell server to run `npm run dev`. If the dev server starts, analyze the terminal output for errors/warnings and recommend fixes.
- Use the http server to GET `API /health`. Then POST `API /api/example` with JSON body `{"sample":true}` and summarize response.
- If VITE_API_BASE_URL or VITE_API_URL is missing, set it in your environment (e.g., .env.local) and reload.
- If endpoints require auth, set `VITE_API_TOKEN` to your service account token (starts with `sa_`).

## How to get a Service Account token (sa_…)

Use your Replit API to create a service account with minimal permissions. Replace placeholders before running:

1) Create a service account (requires a user JWT only once)

```bash
# Set your API base (already in .env.local as VITE_API_URL)
API_BASE="${VITE_API_URL:-https://d12fe605-62cb-49b0-b8ae-60c33cc2dc94-00-3mx79pg8q976x.janeway.replit.dev}"

# Create the service account
curl -sS -X POST "$API_BASE/api/service-accounts" \
	-H "Authorization: Bearer YOUR_USER_JWT_TOKEN" \
	-H "Content-Type: application/json" \
	-d '{
		"name": "Copilot MCP Client",
		"description": "Service account for MCP integration",
		"permissions": ["mcp:read", "mcp:write"]
	}'

# => Response includes: { "token": "sa_abc123def456...", ... }
```

2) Store the token locally for MCP

```bash
# Put in .env.local (do NOT commit)
echo "VITE_API_TOKEN=sa_abc123def456..." >> .env.local
```

Shortcut using the included helper:

```bash
npm run sa:create
# Follow prompts; copy the sa_ token; it will show how to add it to .env.local
```

Non-interactive (do not store USER_JWT_TOKEN; pass it only for this run):

```bash
USER_JWT_TOKEN="<your_user_jwt>" npm run sa:create
npm run sa:probe
```

3) Validate with the HTTP MCP server

```bash
# Health check (usually public)
BASE_URLS="API=$API_BASE" node scripts/mcp-http-server.mjs << 'EOF'
{"jsonrpc":"2.0","id":1,"method":"initialize","params":{}}
{"jsonrpc":"2.0","id":2,"method":"tools/call","params":{"name":"http.get","arguments":{"baseKey":"API","path":"/healthz"}}}
EOF

# Auth-required MCP endpoint (uses Authorization from VITE_API_TOKEN)
BASE_URLS="API=$API_BASE" \
HEADERS_API="Authorization=Bearer ${VITE_API_TOKEN}" \
node scripts/mcp-http-server.mjs << 'EOF'
{"jsonrpc":"2.0","id":1,"method":"initialize","params":{}}
{"jsonrpc":"2.0","id":2,"method":"tools/call","params":{"name":"http.get","arguments":{"baseKey":"API","path":"/api/ai/mcp/envelopes"}}}
EOF
```

Notes:
- Only the SA token (sa_…) is needed for MCP calls. Your user JWT is used only to create the SA and should not be stored in .env.local.
- Keep `.env.local` out of version control; do not paste tokens in issues or commits.