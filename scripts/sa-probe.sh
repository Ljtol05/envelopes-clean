#!/usr/bin/env bash
set -euo pipefail

# Probe an authenticated MCP endpoint using current env

# Load .env.local vars for this shell
if [[ -f .env.local ]]; then
  # shellcheck disable=SC1091
  source <(grep -E '^(VITE_API_URL|VITE_API_TOKEN)=' .env.local | sed 's/^/export /') || true
fi

API_BASE=${VITE_API_URL:-}
if [[ -z "${API_BASE}" ]]; then
  echo "VITE_API_URL not set; add it to .env.local" >&2
  exit 1
fi

export BASE_URLS="API=${API_BASE}"
export HEADERS_API="Authorization=Bearer ${VITE_API_TOKEN:-}"

node scripts/mcp-http-server.mjs << 'EOF'
{"jsonrpc":"2.0","id":1,"method":"initialize","params":{}}
{"jsonrpc":"2.0","id":2,"method":"tools/call","params":{"name":"http.get","arguments":{"baseKey":"API","path":"/api/ai/mcp/envelopes"}}}
EOF
