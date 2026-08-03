#!/usr/bin/env bash
# =============================================================================
#  deploy-dev-vm.sh
# =============================================================================
#  Deploys the Taksu Owner Portal to the local dev VM (owner-portal).
#  Use this for production-mode builds on the VM. For hot-reload dev,
#  SSH into the VM and run: pnpm dev:local
#
#  Usage:
#    bash deploy-dev-vm.sh              # full deploy (rsync + build + restart)
#    bash deploy-dev-vm.sh --no-tests   # skip E2E tests
#
#  Target VM: nick@192.168.101.124 (owner-portal)
#  App URL:   http://192.168.101.124:3000
# =============================================================================

set -euo pipefail

SKIP_TESTS=false
for arg in "$@"; do
  [[ "${arg}" == "--no-tests" ]] && SKIP_TESTS=true
done

VM_HOST="${DEV_VM_HOST:-192.168.101.124}"
VM_USER="${DEV_VM_USER:-nick}"
VM_DIR="${DEV_VM_DIR:-/var/www/taksu-owner-portal-dev}"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

SSH_CMD="ssh -o StrictHostKeyChecking=accept-new ${VM_USER}@${VM_HOST}"

echo ""
echo "=============================================="
echo "  Taksu Owner Portal — Dev VM Deploy"
echo "  Target: ${VM_USER}@${VM_HOST}:${VM_DIR}"
echo "=============================================="
echo ""

# ---------------------------------------------------------------------------
# Step 1: Sync source files
# ---------------------------------------------------------------------------
echo "==> [1/4] Syncing project files..."
rsync -az --delete \
  --exclude='.git' \
  --exclude='node_modules' \
  --exclude='.next' \
  --exclude='.swc' \
  --exclude='.env*' \
  --exclude='logs' \
  --exclude='.DS_Store' \
  --exclude='scratch' \
  "${SCRIPT_DIR}/" \
  "${VM_USER}@${VM_HOST}:${VM_DIR}/"
echo "    Sync complete."
echo ""

# ---------------------------------------------------------------------------
# Step 2: Install + build on VM
# ---------------------------------------------------------------------------
echo "==> [2/4] Installing dependencies and building on VM..."
$SSH_CMD "
  source ~/.bash_profile 2>/dev/null || source ~/.profile 2>/dev/null || true
  cd ${VM_DIR}
  pnpm install --no-frozen-lockfile
  pnpm build:dev
"
echo "    Build complete."
echo ""

# ---------------------------------------------------------------------------
# Step 3: E2E tests (optional)
# ---------------------------------------------------------------------------
if [[ "${SKIP_TESTS}" == "false" ]]; then
  echo "==> [3/4] Running E2E tests on VM..."
  $SSH_CMD "
    source ~/.bash_profile 2>/dev/null || source ~/.profile 2>/dev/null || true
    cd ${VM_DIR}
    pnpm test:e2e:dev || echo 'E2E tests had failures — check report'
  " || true
  echo ""
else
  echo "==> [3/4] Skipping E2E tests."
  echo ""
fi

# ---------------------------------------------------------------------------
# Step 4: Restart PM2
# ---------------------------------------------------------------------------
echo "==> [4/4] Restarting PM2 process..."
$SSH_CMD "
  source ~/.bash_profile 2>/dev/null || source ~/.profile 2>/dev/null || true
  cd ${VM_DIR}

  if pm2 describe taksu-owner-portal-dev > /dev/null 2>&1; then
    pm2 restart taksu-owner-portal-dev
  else
    pm2 start pnpm --name taksu-owner-portal-dev -- start:dev
    pm2 save
  fi
"

echo "==> Waiting for app to be ready..."
for i in {1..15}; do
  sleep 3
  if $SSH_CMD "curl -sf http://localhost:3000 -o /dev/null" 2>/dev/null; then
    echo "    App is up!"
    break
  fi
  echo "    Waiting... (${i})"
done

echo ""
echo "=============================================="
echo "  Deploy complete!"
echo ""
echo "  App:             http://${VM_HOST}:3000"
echo "  Supabase Studio: http://${VM_HOST}:54323"
echo "  Inbucket email:  http://${VM_HOST}:54324"
echo ""
echo "  SSH:             ssh ${VM_USER}@${VM_HOST}"
echo "  Logs:            ssh ${VM_USER}@${VM_HOST} 'pm2 logs taksu-owner-portal-dev'"
echo "  DB Sync:         ssh ${VM_USER}@${VM_HOST} 'cd ${VM_DIR} && pnpm db:sync'"
echo "=============================================="
echo ""
