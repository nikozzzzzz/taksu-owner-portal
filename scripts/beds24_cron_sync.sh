#!/bin/bash

# Navigate to the project root directory
cd "$(dirname "$0")/.."

# Load environment variables
if [ -f .env.local ]; then
  set -a
  source .env.local
  set +a
else
  echo "[$(date)] Error: .env.local file not found!"
  exit 1
fi

if [ -z "$SUPABASE_SERVICE_ROLE_KEY" ]; then
  echo "[$(date)] Error: SUPABASE_SERVICE_ROLE_KEY is not defined in .env.local!"
  exit 1
fi

# Ensure logs directory exists
mkdir -p logs

AUTH_HEADER="Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY"
BASE_URL="http://127.0.0.1:3000"

# ── Step 1: Proactively refresh the Beds24 access token ──────────────────────
# This keeps the token alive even during idle periods and prevents expiry
# from causing sync failures later.
echo "[$(date)] Refreshing Beds24 token (heartbeat)..."
REFRESH_RESPONSE=$(curl -s -w "\nHTTP_STATUS:%{http_code}" -X POST \
  -H "$AUTH_HEADER" \
  -H "Content-Type: application/json" \
  "$BASE_URL/api/beds24/refresh-token")

REFRESH_BODY=$(echo "$REFRESH_RESPONSE" | sed -e 's/HTTP_STATUS\:.*//g')
REFRESH_STATUS=$(echo "$REFRESH_RESPONSE" | tr -d '\n' | grep -o 'HTTP_STATUS:[0-9]\{3\}' | cut -d':' -f2)

if [ "$REFRESH_STATUS" -eq 200 ]; then
  echo "[$(date)] Token refresh succeeded."
elif [ "$REFRESH_STATUS" -eq 404 ]; then
  echo "[$(date)] WARNING: No Beds24 credentials stored — skipping sync. Please reconnect via Admin > Integrations."
  exit 0
else
  echo "[$(date)] WARNING: Token refresh returned HTTP $REFRESH_STATUS: $REFRESH_BODY — attempting sync anyway."
fi

# ── Step 2: Trigger full booking/price sync ───────────────────────────────────
echo "[$(date)] Starting automated Beds24 booking + price sync..."
RESPONSE=$(curl -s -w "\nHTTP_STATUS:%{http_code}" -X POST \
  -H "$AUTH_HEADER" \
  -H "Content-Type: application/json" \
  "$BASE_URL/api/beds24/sync")

HTTP_BODY=$(echo "$RESPONSE" | sed -e 's/HTTP_STATUS\:.*//g')
HTTP_STATUS=$(echo "$RESPONSE" | tr -d '\n' | grep -o 'HTTP_STATUS:[0-9]\{3\}' | cut -d':' -f2)

if [ "$HTTP_STATUS" -eq 200 ]; then
  echo "[$(date)] Sync succeeded: $HTTP_BODY"
else
  echo "[$(date)] Sync failed with HTTP $HTTP_STATUS: $HTTP_BODY"
fi
