#!/bin/bash
set -e

echo "=== Curator Web Deployment Script ==="
echo ""

# Get the directory where this script is located
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

echo "1. Building container image..."
cd "$PROJECT_DIR"
podman build -t localhost/curator-web:latest -f deploy/Dockerfile .
echo "✓ Container image built successfully"
echo ""

echo "2. Copying Quadlet file to systemd user directory..."
QUADLET_DIR="$HOME/.config/containers/systemd"
mkdir -p "$QUADLET_DIR"
cp "$SCRIPT_DIR/curator-web.container" "$QUADLET_DIR/"
echo "✓ Quadlet file copied to $QUADLET_DIR"
echo ""

echo "3. Reloading systemd daemon..."
systemctl --user daemon-reload
echo "✓ Systemd daemon reloaded"
echo ""

echo "4. Restarting service..."
systemctl --user restart curator-web.service
echo "✓ Service restarted"
echo ""

echo "5. Showing service status..."
systemctl --user status curator-web.service
echo ""

echo "6. Showing service logs..."
journalctl --user -u curator-web.service -n 20 --no-pager
echo ""

echo "7. Testing health endpoint..."
sleep 2
if curl -f http://localhost:3100/ > /dev/null 2>&1; then
    echo "✓ Health endpoint is responding"
else
    echo "⚠ Health endpoint not yet responding (service may still be starting)"
fi
echo ""

echo "=== Deployment completed ==="
