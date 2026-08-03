#!/bin/bash
# =============================================================================
# build-local.sh — Local Docker Build and Security Scan
# Usage: ./build-local.sh
# =============================================================================

set -e

APP_NAME="taksu-owner-portal"
IMAGE_NAME="${APP_NAME}-local"

echo -e "\033[0;36m[build]\033[0m Building Docker image $IMAGE_NAME..."
docker build -t "$IMAGE_NAME" .

echo -e "\033[0;32m[✓]\033[0m Docker build complete."

echo -e "\033[0;36m[scan]\033[0m Running Trivy vulnerability scan..."
# Run trivy with HIGH,CRITICAL severities. You can add '--exit-code 1' to fail the script if vulns are found.
trivy image --severity HIGH,CRITICAL "$IMAGE_NAME"

echo -e "\033[0;32m[✓]\033[0m Build and scan complete!"
echo "If the scan passes, you can run './deploy.sh' to push the secure build to production."
