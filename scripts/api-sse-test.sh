#!/usr/bin/env bash
set -euo pipefail
API=${VITE_API_URL:?VITE_API_URL not set}
TOKEN=${VITE_API_TOKEN:?VITE_API_TOKEN not set}

curl -sS -D - \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -H "Accept: text/event-stream" \
  -X POST "$API/api/ai/mcp/chat" \
  --data '{"messages":[{"role":"user","content":"ping sse"}]}' \
  -N -m 12 | head -c 800
