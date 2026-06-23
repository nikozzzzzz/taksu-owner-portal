#!/usr/bin/env bash
# =============================================================================
# deploy.sh — Taksu Owner Portal deployment script
# Usage: ./deploy.sh [--skip-install]
#
# Deploys the Next.js app to the Fedora server at 192.168.101.122.
# Requires: rsync, ssh (key-based auth already configured)
# =============================================================================

set -euo pipefail

# ── Load config from .env.local ──────────────────────────────────────────────────────
LOCAL_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

if [ -f "$LOCAL_DIR/.env.local" ]; then
  # shellcheck disable=SC2046
  export $(grep -v '^#' "$LOCAL_DIR/.env.local" | grep -E '^DEPLOY_' | xargs)
fi

# ── Configuration ─────────────────────────────────────────────────────────────
DEPLOY_HOST="${DEPLOY_HOST:-}"
DEPLOY_USER="${DEPLOY_USER:-root}"
DEPLOY_DIR="${DEPLOY_DIR:-/var/www/taksu-owner-portal}"
SERVER="${DEPLOY_USER}@${DEPLOY_HOST}"
REMOTE_DIR="${DEPLOY_DIR}"
APP_NAME="taksu-owner-portal"
SKIP_INSTALL=false

# ── Colours ───────────────────────────────────────────────────────────────────
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
CYAN='\033[0;36m'
NC='\033[0m'

log()    { echo -e "${CYAN}[deploy]${NC} $*"; }
success(){ echo -e "${GREEN}[✓]${NC} $*"; }
warn()   { echo -e "${YELLOW}[!]${NC} $*"; }
error()  { echo -e "${RED}[✗]${NC} $*"; exit 1; }

# ── Parse args ────────────────────────────────────────────────────────────────
for arg in "$@"; do
  case $arg in
    --skip-install) SKIP_INSTALL=true ;;
    *) warn "Unknown argument: $arg" ;;
  esac
done

# ── Pre-flight checks ─────────────────────────────────────────────────────────
log "Pre-flight checks..."
command -v rsync &>/dev/null || error "rsync is not installed locally"
command -v ssh   &>/dev/null || error "ssh is not installed locally"

[ -z "$DEPLOY_HOST" ] && error "DEPLOY_HOST is not set — add it to .env.local"

if [ ! -f "$LOCAL_DIR/.env.local" ]; then
  error ".env.local not found in $LOCAL_DIR — aborting"
fi

# ── Sync source files ─────────────────────────────────────────────────────────
log "Syncing source files to ${SERVER}:${REMOTE_DIR} ..."
rsync -avz --delete \
  --exclude='.git' \
  --exclude='node_modules' \
  --exclude='.next' \
  --exclude='.swc' \
  --exclude='.env*' \
  --exclude='*.log' \
  --exclude='.DS_Store' \
  "$LOCAL_DIR/" "${SERVER}:${REMOTE_DIR}/"
success "Source files synced"

# ── Copy .env.local ───────────────────────────────────────────────────────────
log "Copying .env.local to server..."
rsync -avz "$LOCAL_DIR/.env.local" "${SERVER}:${REMOTE_DIR}/.env.local"
success ".env.local uploaded"

# ── Remote: install, build, restart ───────────────────────────────────────────
log "Running remote install + build + restart..."
ssh -o StrictHostKeyChecking=no "$SERVER" bash -s -- "$REMOTE_DIR" "$APP_NAME" "$SKIP_INSTALL" << 'REMOTE'
set -euo pipefail

REMOTE_DIR="$1"
APP_NAME="$2"
SKIP_INSTALL="$3"

GREEN='\033[0;32m'
CYAN='\033[0;36m'
NC='\033[0m'

log()    { echo -e "${CYAN}[remote]${NC} $*"; }
success(){ echo -e "${GREEN}[✓]${NC} $*"; }

cd "$REMOTE_DIR"

if [ "$SKIP_INSTALL" = "false" ]; then
  log "Installing dependencies (pnpm install)..."
  pnpm install --no-frozen-lockfile
  success "Dependencies installed"
fi

log "Building application (pnpm build)..."
pnpm build
success "Build complete"

log "Installing Playwright browsers..."
npx playwright install chromium
success "Playwright browsers installed"

log "Running E2E tests (pnpm test:e2e)..."
pnpm test:e2e
success "E2E tests passed"

log "Restarting PM2 process: $APP_NAME..."
if pm2 describe "$APP_NAME" &>/dev/null; then
  pm2 restart "$APP_NAME"
else
  pm2 start npm --name "$APP_NAME" -- start
fi
pm2 save
success "PM2 restarted"
REMOTE

success "Remote steps complete"

# ── Health check ──────────────────────────────────────────────────────────────
log "Running health check..."
sleep 5
HTTP_CODE=$(curl -sk -o /dev/null -w "%{http_code}" --max-time 15 "https://${DEPLOY_HOST}" || echo "000")

if [ "$HTTP_CODE" = "200" ] || [ "$HTTP_CODE" = "301" ] || [ "$HTTP_CODE" = "302" ] || [ "$HTTP_CODE" = "307" ]; then
  success "Health check passed — HTTP $HTTP_CODE"
  echo ""
  echo -e "${GREEN}╔══════════════════════════════════════════════╗${NC}"
  echo -e "${GREEN}║  🚀 Deployment successful!                   ║${NC}"
  echo -e "${GREEN}║  https://${DEPLOY_HOST}$(printf '%*s' $((24 - ${#DEPLOY_HOST})) '')║${NC}"
  echo -e "${GREEN}╚══════════════════════════════════════════════╝${NC}"
else
  warn "Health check returned HTTP $HTTP_CODE — check server logs"
  echo "  ssh ${SERVER} pm2 logs ${APP_NAME}"
fi
