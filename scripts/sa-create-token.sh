#!/usr/bin/env bash
set -euo pipefail

# Helper to create a Service Account token (sa_...) for MCP.
# - Reads API base from .env.local (VITE_API_URL) if present
# - Prompts for YOUR user JWT (not stored)
# - Creates the SA with minimal permissions
# - Prints the token and how to add it to .env.local

# If SA_TOKEN is already provided, just persist it and exit
if [[ -n "${SA_TOKEN:-}" ]]; then
  touch .env.local
  if grep -q '^VITE_API_TOKEN=' .env.local; then
    sed -i '' "s/^VITE_API_TOKEN=.*/VITE_API_TOKEN=${SA_TOKEN//\//\\\/}/" .env.local
    echo "Updated VITE_API_TOKEN in .env.local"
  else
    echo "VITE_API_TOKEN=${SA_TOKEN}" >> .env.local
    echo "Added VITE_API_TOKEN to .env.local"
  fi
  echo "SA token persisted from SA_TOKEN environment variable."
  exit 0
fi

# Load API base from .env.local if present
API_BASE=${VITE_API_URL:-}
if [[ -z "${API_BASE}" && -f ".env.local" ]]; then
  # shellcheck disable=SC1091
  source <(grep -E '^(VITE_API_URL|VITE_HEALTH_BASE_URL)=' .env.local | sed 's/^/export /') || true
  API_BASE=${VITE_API_URL:-}
fi

if [[ -z "${API_BASE}" ]]; then
  read -r -p "API base URL (e.g., https://...replit.dev): " API_BASE
fi

if [[ -z "${USER_JWT_TOKEN:-}" ]]; then
  read -r -s -p "Enter YOUR user JWT token (input hidden; not stored): " USER_JWT_TOKEN
  echo
fi

SA_NAME=${SA_NAME:-"Copilot MCP Client"}
SA_PERMS=${SA_PERMS:-"[\"mcp:read\",\"mcp:write\"]"}

echo "Creating service account at: ${API_BASE%/}/api/service-accounts"
RESP=$(curl -sS -X POST "${API_BASE%/}/api/service-accounts" \
  -H "Authorization: Bearer ${USER_JWT_TOKEN}" \
  -H "Content-Type: application/json" \
  -d "{\"name\":\"${SA_NAME}\",\"description\":\"Service account for MCP integration\",\"permissions\":${SA_PERMS}}")

echo "Raw response:"
echo "${RESP}"

# Try jq first
if command -v jq >/dev/null 2>&1; then
  SA_TOKEN=$(printf '%s' "${RESP}" | jq -r '.token // empty')
else
  # Fallback to sed if jq isn't available
  SA_TOKEN=$(printf '%s' "${RESP}" | sed -n 's/.*"token"[[:space:]]*:[[:space:]]*"\([^"]*\)".*/\1/p')
fi

if [[ -n "${SA_TOKEN}" ]]; then
  echo
  echo "Service account token detected: ${SA_TOKEN}"
  # Ensure .env.local exists
  touch .env.local
  if grep -q '^VITE_API_TOKEN=' .env.local; then
    # macOS/BSD sed in-place requires a backup suffix; use '' for none
    sed -i '' "s/^VITE_API_TOKEN=.*/VITE_API_TOKEN=${SA_TOKEN//\//\\\/}/" .env.local
    echo "Updated VITE_API_TOKEN in .env.local"
  else
    echo "VITE_API_TOKEN=${SA_TOKEN}" >> .env.local
    echo "Added VITE_API_TOKEN to .env.local"
  fi
  echo "Done. Copilot HTTP MCP will pick this up automatically on next call."
  exit 0
else
  echo "Could not parse token from response. Check the output above."
  exit 1
fi
