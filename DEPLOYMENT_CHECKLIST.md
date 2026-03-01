# Curator Web Deployment Checklist

## Pre-Deployment

- [ ] All tests pass (`bun run test`)
- [ ] TypeScript compiles (`bun run tsc --noEmit`)
- [ ] Production build succeeds (`bun run build`)
- [ ] Docker image builds (`podman build -f deploy/Dockerfile .`)
- [ ] Environment variables documented in `.env.example`

## Deployment Steps

- [ ] Build container image
  ```bash
  podman build -t curator-web:latest -f deploy/Dockerfile .
  ```
- [ ] Copy Quadlet config to systemd directory
  ```bash
  sudo cp deploy/curator-web.container /etc/containers/systemd/
  ```
- [ ] Reload systemd daemon
  ```bash
  sudo systemctl daemon-reload
  ```
- [ ] Start service
  ```bash
  sudo systemctl start curator-web
  ```
- [ ] Verify container running
  ```bash
  podman ps | grep curator-web
  ```
- [ ] Check health endpoint
  ```bash
  curl http://localhost:3001/
  ```
- [ ] Update Caddy configuration
  ```bash
  sudo nano /etc/caddy/Caddyfile
  ```
- [ ] Reload Caddy
  ```bash
  sudo systemctl reload caddy
  ```
- [ ] Test via Tailscale DNS
  ```bash
  curl https://curator.tail-scale-domain.ts.net/
  ```

## Post-Deployment Validation

- [ ] UI loads without errors
- [ ] API connectivity works
- [ ] Dark mode toggle functions
- [ ] Subscription CRUD works
- [ ] No console errors in browser DevTools
- [ ] Cross-linking to Engram UI works

## Rollback Plan

- [ ] Document previous container image tag
  ```bash
  podman images | grep curator-web
  ```
- [ ] Keep previous Quadlet config backup
  ```bash
  sudo cp /etc/containers/systemd/curator-web.container /etc/containers/systemd/curator-web.container.backup
  ```
- [ ] Test rollback procedure
  ```bash
  # Stop current service
  sudo systemctl stop curator-web

  # Restore backup config or use previous image
  podman run -d --name curator-web -p 3001:80 curator-web:previous-tag

  # Restart service
  sudo systemctl start curator-web
  ```

## Troubleshooting

- Check logs: `podman logs curator-web`
- Check service status: `sudo systemctl status curator-web`
- Check container status: `podman ps -a`
- Verify port binding: `ss -tulpn | grep 3001`
