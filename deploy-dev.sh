#!/usr/bin/env bash
# =============================================================================
#  deploy-dev.sh
# =============================================================================
#  Builds and starts the Taksu Owner Portal locally for development/testing.
#  Uses .env.dev instead of .env.local so production is never affected.
#
#  Usage:
#    bash deploy-dev.sh [--no-tests]
#
#  Options:
#    --no-tests    Skip Playwright E2E tests after build
#
#  For hot-reload day-to-day dev work, use instead:
#    pnpm dev:local
#
#  This script is for production-mode local validation (next build + next start).
# =============================================================================

set -euo pipefail

SKIP_TESTS=false
for arg in "$@"; do
  [[ "${arg}" == "--no-tests" ]] && SKIP_TESTS=true
done

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="${SCRIPT_DIR}"
ENV_FILE="${PROJECT_ROOT}/.env.dev"

# ---------------------------------------------------------------------------
# Checks
# ---------------------------------------------------------------------------
if [[ ! -f "${ENV_FILE}" ]]; then
  echo "ERROR: .env.dev not found. Copy it from the template and fill in Supabase keys."
  exit 1
fi

# Load env vars to check NEXT_PUBLIC_SUPABASE_URL
set -o allexport
# shellcheck disable=SC1090
source <(grep -E '^[A-Za-z_][A-Za-z0-9_]*=' "${ENV_FILE}")
set +o allexport

if [[ "${NEXT_PUBLIC_SUPABASE_URL:-}" == *"REPLACE_WITH"* ]] || [[ -z "${NEXT_PUBLIC_SUPABASE_ANON_KEY:-}" ]]; then
  echo "ERROR: .env.dev still has placeholder values for Supabase keys."
  echo "       Run 'pnpm supabase:start' and copy the keys into .env.dev."
  exit 1
fi

echo ""
echo "=============================================="
echo "  Taksu Owner Portal — Local Dev Deploy"
echo "=============================================="
echo "  Env   : ${ENV_FILE}"
echo "  App   : http://localhost:3000"
echo "  DB    : ${NEXT_PUBLIC_SUPABASE_URL}"
echo ""

# ---------------------------------------------------------------------------
# Step 1: Install dependencies
# ---------------------------------------------------------------------------
echo "==> [1/4] Installing dependencies..."
cd "${PROJECT_ROOT}"
pnpm install --no-frozen-lockfile
echo "    Done."
echo ""

# ---------------------------------------------------------------------------
# Step 2: Build
# ---------------------------------------------------------------------------
echo "==> [2/4] Building Next.js app (using .env.dev)..."
dotenv -e .env.dev -- pnpm build
echo "    Build complete."
echo ""

# ---------------------------------------------------------------------------
# Step 3: E2E tests (optional)
# ---------------------------------------------------------------------------
if [[ "${SKIP_TESTS}" == "false" ]]; then
  echo "==> [3/4] Running Playwright E2E tests against http://localhost:3000..."
  echo "    Starting app in background for test run..."

  # Start the app briefly for E2E tests
  dotenv -e .env.dev -- pnpm start &
  APP_PID=$!

  # Wait for app to be ready
  MAX_WAIT=60
  ELAPSED=0
  until curl -sf http://localhost:3000 -o /dev/null 2>/dev/null; do
    sleep 2
    ELAPSED=$((ELAPSED + 2))
    if [[ ${ELAPSED} -ge ${MAX_WAIT} ]]; then
      echo "ERROR: App did not start within ${MAX_WAIT}s."
      kill "${APP_PID}" 2>/dev/null || true
      exit 1
    fi
    echo "    Waiting for app... (${ELAPSED}s)"
  done
  echo "    App is ready."

  dotenv -e .env.dev -- pnpm playwright test || {
    echo ""
    echo "WARNING: Some E2E tests failed. Check the report: pnpm playwright show-report"
    echo "         The app will still be started below."
  }

  kill "${APP_PID}" 2>/dev/null || true
  wait "${APP_PID}" 2>/dev/null || true
  echo ""
else
  echo "==> [3/4] Skipping E2E tests (--no-tests flag set)."
  echo ""
fi

# ---------------------------------------------------------------------------
# Step 4: Start the app
# ---------------------------------------------------------------------------
echo "==> [4/4] Starting Next.js in production mode..."
echo ""
echo "  App:            http://localhost:3000"
echo "  Supabase Studio: http://localhost:54323"
echo "  Inbucket email: http://localhost:54324"
echo ""
echo "  Press Ctrl+C to stop."
echo ""

dotenv -e .env.dev -- pnpm start
