#!/usr/bin/env bash
# =============================================================================
#  sync-db-from-prod.sh
# =============================================================================
#  Copies the production PostgreSQL database to the local Supabase dev instance.
#
#  Usage:
#    pnpm db:sync
#
#  Prerequisites:
#    1. Local Supabase must be running: pnpm supabase:start
#    2. SSH access to prod server must work without a password prompt:
#       ssh taksu22@portal.taksuliving.com "echo ok"
#    3. psql must be available in PATH (comes with PostgreSQL client tools)
#    4. .env.dev must exist in the project root
#
#  CAUTION: This OVERWRITES the local dev database. It never touches production.
# =============================================================================

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"

# ---------------------------------------------------------------------------
# Load dev environment
# ---------------------------------------------------------------------------
ENV_FILE="${PROJECT_ROOT}/.env.dev"
if [[ ! -f "${ENV_FILE}" ]]; then
  echo "ERROR: ${ENV_FILE} not found. Create it first (see .env.dev in the project root)."
  exit 1
fi

# Source only lines that are valid KEY=VALUE assignments (skip comments/blanks)
set -o allexport
# shellcheck disable=SC1090
source <(grep -E '^[A-Za-z_][A-Za-z0-9_]*=' "${ENV_FILE}")
set +o allexport

# ---------------------------------------------------------------------------
# Configuration — production server
# ---------------------------------------------------------------------------
PROD_HOST="${DEPLOY_HOST:-portal.taksuliving.com}"
PROD_USER="${DEPLOY_USER:-taksu22}"

# Name of the Supabase PostgreSQL Docker container on the prod server.
# Verify with: ssh taksu22@portal.taksuliving.com "docker ps --format '{{.Names}}' | grep -i postgres"
PROD_DB_CONTAINER="${PROD_DB_CONTAINER:-supabase-db}"
PROD_DB_NAME="postgres"
PROD_DB_USER="postgres"

# ---------------------------------------------------------------------------
# Configuration — local Supabase
# ---------------------------------------------------------------------------
LOCAL_DB_HOST="127.0.0.1"
LOCAL_DB_PORT="${LOCAL_DB_PORT:-5432}"
LOCAL_DB_USER="postgres"
LOCAL_DB_NAME="postgres"
LOCAL_DB_PASSWORD="${LOCAL_DB_PASSWORD:-postgres}"

# Remote and local temp paths for the dump file
REMOTE_DUMP_FILE="/tmp/taksu_prod_dump_$(date +%Y%m%d_%H%M%S).sql"
LOCAL_DUMP_FILE="/tmp/taksu_local_restore.sql"

# ---------------------------------------------------------------------------
# Sanity checks
# ---------------------------------------------------------------------------
echo ""
echo "=================================================="
echo "  Taksu Owner Portal — DB Sync: PROD -> LOCAL"
echo "=================================================="
echo "  From: ${PROD_USER}@${PROD_HOST} (container: ${PROD_DB_CONTAINER})"
echo "  To  : ${LOCAL_DB_HOST}:${LOCAL_DB_PORT}/${LOCAL_DB_NAME}"
echo ""
echo "  WARNING: This will OVERWRITE your local dev database."
read -r -p "  Continue? [y/N] " confirm
if [[ "${confirm}" != "y" && "${confirm}" != "Y" ]]; then
  echo "  Aborted."
  exit 0
fi
echo ""

# Check SSH connectivity
echo "==> Checking SSH connectivity to production server..."
if ! ssh -o ConnectTimeout=10 -o BatchMode=yes "${PROD_USER}@${PROD_HOST}" "echo 'SSH OK'" 2>/dev/null; then
  echo "ERROR: Cannot SSH into ${PROD_USER}@${PROD_HOST}."
  echo "       Make sure key-based SSH is configured for this machine."
  echo "       Test with: ssh ${PROD_USER}@${PROD_HOST} echo ok"
  exit 1
fi
echo "    SSH OK."
echo ""

# Check local psql
if ! command -v psql &>/dev/null; then
  echo "ERROR: psql not found in PATH."
  echo "       Install PostgreSQL client tools:"
  echo "         Windows: https://www.postgresql.org/download/windows/ (select 'Command Line Tools')"
  echo "         Or via scoop: scoop install postgresql"
  exit 1
fi

# Check local Supabase is running
echo "==> Checking local Supabase is running..."
if ! PGPASSWORD="${LOCAL_DB_PASSWORD}" psql \
    -h "${LOCAL_DB_HOST}" -p "${LOCAL_DB_PORT}" \
    -U "${LOCAL_DB_USER}" -d "${LOCAL_DB_NAME}" \
    -c "SELECT 1;" &>/dev/null; then
  echo "ERROR: Cannot connect to local Supabase PostgreSQL at ${LOCAL_DB_HOST}:${LOCAL_DB_PORT}."
  echo "       Start it with: pnpm supabase:start"
  exit 1
fi
echo "    Local Supabase is running."
echo ""

# ---------------------------------------------------------------------------
# Step 1: Dump production database via SSH + docker exec
# ---------------------------------------------------------------------------
echo "==> [1/4] Dumping production database (this may take a minute)..."
ssh "${PROD_USER}@${PROD_HOST}" "
  docker exec '${PROD_DB_CONTAINER}' pg_dump \
    -U '${PROD_DB_USER}' \
    -d '${PROD_DB_NAME}' \
    --no-owner \
    --no-acl \
    --no-privileges \
    -N 'auth' \
    -N 'storage' \
    -N 'realtime' \
    -N 'supabase_functions' \
    -N '_realtime' \
    -N 'pgsodium' \
    -N 'pgsodium_masks' \
    -N 'pgbouncer' \
    -N 'vault' \
    > '${REMOTE_DUMP_FILE}'
  echo 'Dump complete: ${REMOTE_DUMP_FILE}'
"
echo "    Dump complete on server."
echo ""

# ---------------------------------------------------------------------------
# Step 2: Download dump file
# ---------------------------------------------------------------------------
echo "==> [2/4] Downloading dump file from server..."
scp "${PROD_USER}@${PROD_HOST}:${REMOTE_DUMP_FILE}" "${LOCAL_DUMP_FILE}"
echo "    Downloaded to: ${LOCAL_DUMP_FILE}"
echo ""

# Clean up remote dump
echo "==> Cleaning up dump file on server..."
ssh "${PROD_USER}@${PROD_HOST}" "rm -f '${REMOTE_DUMP_FILE}'"

# ---------------------------------------------------------------------------
# Step 3: Restore to local Supabase
# ---------------------------------------------------------------------------
echo "==> [3/4] Restoring to local Supabase..."
echo "    Dropping and recreating public schema..."
PGPASSWORD="${LOCAL_DB_PASSWORD}" psql \
  -h "${LOCAL_DB_HOST}" -p "${LOCAL_DB_PORT}" \
  -U "${LOCAL_DB_USER}" -d "${LOCAL_DB_NAME}" \
  -c "DROP SCHEMA IF EXISTS public CASCADE; CREATE SCHEMA public;" \
  --quiet

echo "    Restoring data (this may take a moment)..."
PGPASSWORD="${LOCAL_DB_PASSWORD}" psql \
  -h "${LOCAL_DB_HOST}" -p "${LOCAL_DB_PORT}" \
  -U "${LOCAL_DB_USER}" -d "${LOCAL_DB_NAME}" \
  --quiet \
  < "${LOCAL_DUMP_FILE}"

echo "    Restore complete."
echo ""

# ---------------------------------------------------------------------------
# Step 4: Re-run Playwright global setup to ensure test users exist
# ---------------------------------------------------------------------------
echo "==> [4/4] Seeding Playwright test users in local dev DB..."
echo "    (Running tests/e2e/setup/global.setup.ts via dotenv .env.dev)"
if command -v npx &>/dev/null; then
  # Run global setup standalone using ts-node
  cd "${PROJECT_ROOT}"
  dotenv -e .env.dev -- npx ts-node \
    --project tsconfig.json \
    --skip-project \
    -e "require('./tests/e2e/setup/global.setup.ts').default({})" \
    2>/dev/null || echo "    (Playwright seed skipped — run 'pnpm test:e2e:dev' to seed on first run)"
fi

# ---------------------------------------------------------------------------
# Done
# ---------------------------------------------------------------------------
echo ""
echo "=================================================="
echo "  Done! Local dev DB is now a copy of production."
echo ""
echo "  Next steps:"
echo "    pnpm dev:local               # Start the dev server"
echo "    open http://localhost:3000   # Open the app"
echo "    open http://localhost:54323  # Supabase Studio (browse local DB)"
echo "    open http://localhost:54324  # Inbucket (view test emails)"
echo "=================================================="
echo ""
