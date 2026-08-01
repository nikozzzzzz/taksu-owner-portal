#!/bin/bash

# Navigate to the project root directory
cd "$(dirname "$0")/.."

# Load environment variables
if [ -f .env.local ]; then
  # Export variables from env file, ignoring comments and empty lines
  export $(grep -v '^#' .env.local | xargs)
else
  echo "[$(date)] Error: .env.local file not found!" >> logs/cron_sync.log
  exit 1
fi

if [ -z "$SUPABASE_SERVICE_ROLE_KEY" ]; then
  echo "[$(date)] Error: SUPABASE_SERVICE_ROLE_KEY is not defined in .env.local!" >> logs/cron_sync.log
  exit 1
fi

# Ensure logs directory exists
mkdir -p logs

# Trigger full sync via Next.js API
echo "[$(date)] Starting automated Beds24 polling sync..." >> logs/cron_sync.log
RESPONSE=$(curl -s -w "\nHTTP_STATUS:%{http_code}" -X POST \
  -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY" \
  -H "Content-Type: application/json" \
  http://127.0.0.1:3000/api/beds24/sync)

HTTP_BODY=$(echo "$RESPONSE" | sed -e 's/HTTP_STATUS\:.*//g')
HTTP_STATUS=$(echo "$RESPONSE" | tr -d '\n' | grep -o 'HTTP_STATUS:[0-9]\{3\}' | cut -d':' -f2)

if [ "$HTTP_STATUS" -eq 200 ]; then
  echo "[$(date)] Sync succeeded: $HTTP_BODY" >> logs/cron_sync.log
else
  echo "[$(date)] Sync failed with HTTP $HTTP_STATUS: $HTTP_BODY" >> logs/cron_sync.log
fi
