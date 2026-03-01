# Deployment Guide

This document provides comprehensive instructions for building, deploying, and maintaining the Curator Web frontend in production environments.

## Table of Contents

- [Production Build Process](#production-build-process)
- [Container Configuration](#container-configuration)
- [Deployment Methods](#deployment-methods)
- [Caddy Reverse Proxy](#caddy-reverse-proxy-integration)
- [Monitoring and Logs](#monitoring-and-logs)
- [Backup and Maintenance](#backup-and-maintenance)
- [Security Considerations](#security-considerations)
- [Troubleshooting](#troubleshooting)

## Production Build Process

### Build Steps Overview

The production build process involves:
1. Compiling TypeScript to JavaScript
2. Bundling assets with Vite
3. Optimizing and minifying code
4. Generating static HTML/CSS/JS files

### Manual Build

```bash
# Navigate to project directory
cd /path/to/curator-web

# Install dependencies (if needed)
bun install --frozen-lockfile

# Run production build
bun run build
```

**Output**: Static files in `dist/` directory

```
dist/
├── index.html
├── assets/
│   ├── index-[hash].js
│   ├── index-[hash].css
│   └── [other assets]
└── [other static files]
```

### Build Configuration

**vite.config.ts** (if customized):

```typescript
export default defineConfig({
  build: {
    outDir: 'dist',
    sourcemap: false, // Disable in production
    minify: 'esbuild',
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'ui-vendor': ['@radix-ui/react-*'],
        },
      },
    },
  },
})
```

### Environment Variables

Create `.env.production`:

```env
VITE_CURATOR_API_URL=https://api.curator.yourdomain.com
VITE_CURATOR_API_KEY=your-production-api-key
VITE_APP_NAME=Curator
```

**Important**: Environment variables are embedded at build time, not runtime.

## Container Configuration

### Dockerfile Structure

The project uses a **multi-stage Docker build** for optimal image size and security.

**deploy/Dockerfile**:

```dockerfile
# Stage 1: Builder
FROM oven/bun:1 AS builder

WORKDIR /app

# Copy package files
COPY package.json bun.lock ./

# Install dependencies with frozen lockfile
RUN bun install --frozen-lockfile

# Copy source code
COPY . .

# Build the application
RUN bun run build

# Stage 2: Production
FROM nginx:alpine

# Copy built assets from builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy nginx configuration
COPY deploy/nginx.conf /etc/nginx/conf.d/default.conf

# Expose port 80
EXPOSE 80

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
```

### Nginx Configuration

**deploy/nginx.conf**:

```nginx
server {
    listen 80;
    server_name _;
    root /usr/share/nginx/html;
    index index.html;

    # Enable gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript
               application/javascript application/xml+rss application/json;

    # Cache static assets
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # API proxy (forward to backend)
    location /api/ {
        proxy_pass http://curator:8950/api/;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Health check proxy
    location /health {
        proxy_pass http://curator:8950/health;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    # SPA routing - try files then fallback to index.html
    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

**Key Features**:
- Gzip compression for text assets
- Long-term caching for static assets
- API proxying to backend service
- SPA routing support (client-side routes)
- Health check endpoint

### Quadlet Configuration

**deploy/curator-web.container**:

```ini
[Unit]
Description=Curator Web Frontend
After=curator.service

[Container]
Image=localhost/curator-web:latest
ContainerName=curator-web
Network=engram-net
PublishPort=3100:80
HealthCmd=curl -f http://localhost/
HealthInterval=30s

[Service]
Restart=always
TimeoutStartSec=120

[Install]
WantedBy=default.target
```

**Configuration Explained**:
- `After=curator.service`: Ensures backend starts first
- `Network=engram-net`: Shared network with backend
- `PublishPort=3100:80`: Exposes on host port 3100
- `HealthCmd`: Container health checks
- `Restart=always`: Auto-restart on failure

## Deployment Methods

### Method 1: Automated Deployment Script

**deploy/deploy.sh**:

```bash
#!/bin/bash
set -e

echo "=== Curator Web Deployment Script ==="

# Build container image
podman build -t localhost/curator-web:latest -f deploy/Dockerfile .

# Copy Quadlet file
QUADLET_DIR="$HOME/.config/containers/systemd"
mkdir -p "$QUADLET_DIR"
cp deploy/curator-web.container "$QUADLET_DIR/"

# Reload systemd daemon
systemctl --user daemon-reload

# Restart service
systemctl --user restart curator-web.service

# Check status
systemctl --user status curator-web.service
```

**Usage**:

```bash
cd /path/to/curator-web
chmod +x deploy/deploy.sh
./deploy/deploy.sh
```

### Method 2: Manual Deployment

```bash
# 1. Build image
cd /path/to/curator-web
podman build -t localhost/curator-web:latest -f deploy/Dockerfile .

# 2. Stop existing container (if running)
systemctl --user stop curator-web.service

# 3. Copy Quadlet configuration
mkdir -p ~/.config/containers/systemd
cp deploy/curator-web.container ~/.config/containers/systemd/

# 4. Reload systemd daemon
systemctl --user daemon-reload

# 5. Start service
systemctl --user start curator-web.service

# 6. Enable auto-start on boot
systemctl --user enable curator-web.service

# 7. Verify status
systemctl --user status curator-web.service
```

### Method 3: Docker Compose (Alternative)

**docker-compose.yml**:

```yaml
version: '3.8'

services:
  curator-web:
    build:
      context: .
      dockerfile: deploy/Dockerfile
    ports:
      - "3100:80"
    networks:
      - engram-net
    restart: always
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost/"]
      interval: 30s
      timeout: 10s
      retries: 3

networks:
  engram-net:
    external: true
```

**Usage**:

```bash
docker-compose up -d
docker-compose logs -f curator-web
```

### Method 4: Kubernetes Deployment (Advanced)

**k8s/deployment.yaml**:

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: curator-web
spec:
  replicas: 2
  selector:
    matchLabels:
      app: curator-web
  template:
    metadata:
      labels:
        app: curator-web
    spec:
      containers:
      - name: curator-web
        image: localhost/curator-web:latest
        ports:
        - containerPort: 80
        livenessProbe:
          httpGet:
            path: /
            port: 80
          initialDelaySeconds: 10
          periodSeconds: 30
```

## Caddy Reverse Proxy Integration

### Basic Configuration

**Caddyfile**:

```
curator.yourdomain.com {
    reverse_proxy localhost:3100

    encode gzip

    log {
        output file /var/log/caddy/curator-web.log {
            roll_size 100mb
            roll_keep 5
            roll_keep_for 720h
        }
    }
}
```

### Advanced Configuration with Tailscale

**Caddyfile**:

```
curator.yourdomain.ts.net {
    # Tailscale automatic HTTPS
    reverse_proxy localhost:3100

    # Security headers
    header {
        Strict-Transport-Security "max-age=31536000; includeSubDomains; preload"
        X-Frame-Options "SAMEORIGIN"
        X-Content-Type-Options "nosniff"
        Referrer-Policy "strict-origin-when-cross-origin"
    }

    # Compression
    encode gzip zstd

    # Access logging
    log {
        output file /var/log/caddy/curator-web-access.log
        format json
    }
}
```

### Rate Limiting (Optional)

```
curator.yourdomain.com {
    reverse_proxy localhost:3100

    # Rate limiting
    rate_limit {
        zone curator_web {
            key {remote_host}
            events 100
            window 1m
        }
    }
}
```

### Reload Caddy Configuration

```bash
# Test configuration
sudo caddy validate --config /etc/caddy/Caddyfile

# Reload without downtime
sudo systemctl reload caddy

# Or force restart
sudo systemctl restart caddy
```

## Monitoring and Logs

### Service Status

```bash
# Check service status
systemctl --user status curator-web.service

# Follow service logs
journalctl --user -u curator-web.service -f

# View recent logs
journalctl --user -u curator-web.service -n 100

# View logs since boot
journalctl --user -u curator-web.service -b
```

### Container Logs

```bash
# View container logs
podman logs curator-web

# Follow container logs
podman logs -f curator-web

# View last 100 lines
podman logs --tail 100 curator-web

# View logs with timestamps
podman logs -t curator-web
```

### Nginx Access Logs

```bash
# Access logs (inside container)
podman exec curator-web tail -f /var/log/nginx/access.log

# Error logs
podman exec curator-web tail -f /var/log/nginx/error.log
```

### Health Checks

```bash
# Check application health
curl http://localhost:3100/

# Check API proxy
curl http://localhost:3100/api/health

# Check with verbose output
curl -v http://localhost:3100/
```

### Monitoring Tools

#### 1. Systemd Service Monitoring

```bash
# Watch service status
watch -n 5 'systemctl --user status curator-web.service'
```

#### 2. Prometheus Metrics (Future)

Expose nginx metrics:

```nginx
location /metrics {
    stub_status on;
    access_log off;
    allow 127.0.0.1;
    deny all;
}
```

#### 3. Uptime Monitoring

Use external services:
- UptimeRobot
- Pingdom
- Uptime Kuma (self-hosted)

### Log Rotation

Systemd automatically rotates journal logs. For Caddy logs:

**logrotate configuration** (`/etc/logrotate.d/caddy`):

```
/var/log/caddy/*.log {
    daily
    rotate 14
    compress
    delaycompress
    notifempty
    missingok
    postrotate
        systemctl reload caddy
    endscript
}
```

## Backup and Maintenance

### What to Backup

1. **Source Code**: Git repository (primary backup)
2. **Container Images**: Tagged releases
3. **Configuration Files**: `.env.production`, Quadlet files
4. **Deployment Scripts**: `deploy/` directory

### Backup Strategy

#### 1. Image Backup

```bash
# Save container image
podman save localhost/curator-web:latest -o curator-web-backup.tar

# Compress
gzip curator-web-backup.tar

# Upload to backup storage
rsync curator-web-backup.tar.gz user@backup:/backups/
```

#### 2. Configuration Backup

```bash
# Backup Quadlet configuration
cp ~/.config/containers/systemd/curator-web.container ~/backups/

# Backup environment variables (encrypt!)
gpg -c .env.production
```

#### 3. Git Tags

```bash
# Tag release
git tag -a v1.0.0 -m "Production release 1.0.0"
git push origin v1.0.0

# Build from tag
git checkout v1.0.0
podman build -t localhost/curator-web:v1.0.0 -f deploy/Dockerfile .
```

### Maintenance Tasks

#### Weekly

```bash
# Check for system updates
sudo dnf update

# Check container health
systemctl --user status curator-web.service

# Review logs for errors
journalctl --user -u curator-web.service --since "1 week ago" | grep -i error
```

#### Monthly

```bash
# Clean up old images
podman image prune -a

# Update dependencies
cd /path/to/curator-web
bun update

# Rebuild and test
bun run build
```

#### Quarterly

```bash
# Full security audit
npm audit
bun audit (if available)

# Review and update dependencies
bun outdated
bun update --latest

# Performance testing
lighthouse http://curator.yourdomain.com
```

### Update Procedure

```bash
# 1. Pull latest code
git pull origin main

# 2. Review changes
git log --oneline -10

# 3. Update dependencies
bun install

# 4. Test build locally
bun run build
bun run preview

# 5. Deploy to production
./deploy/deploy.sh

# 6. Verify deployment
curl http://localhost:3100/
journalctl --user -u curator-web.service -n 20

# 7. If issues, rollback
podman pull localhost/curator-web:previous
systemctl --user restart curator-web.service
```

## Security Considerations

### 1. HTTPS Only

Always use HTTPS in production:
- Let's Encrypt with Caddy (automatic)
- Tailscale HTTPS certificates
- Custom certificates

### 2. API Key Protection

```bash
# NEVER commit API keys to git
echo ".env*" >> .gitignore

# Use encrypted secrets
gpg -c .env.production
```

### 3. Container Security

```bash
# Run as non-root (Nginx does this automatically)
# Scan for vulnerabilities
podman scan localhost/curator-web:latest

# Use specific base image versions
FROM nginx:1.25.3-alpine
```

### 4. Network Security

```bash
# Isolate on private network
podman network create --internal engram-net

# Only expose necessary ports
PublishPort=127.0.0.1:3100:80  # localhost only
```

### 5. Security Headers

Already configured in Caddy:
- Strict-Transport-Security
- X-Frame-Options
- X-Content-Type-Options
- Referrer-Policy

### 6. Regular Updates

```bash
# Update base image
podman pull nginx:alpine

# Rebuild with latest base
podman build -t localhost/curator-web:latest -f deploy/Dockerfile .
```

## Troubleshooting

### Container Won't Start

```bash
# Check image exists
podman images | grep curator-web

# Check port availability
netstat -tuln | grep 3100

# Check Quadlet file syntax
cat ~/.config/containers/systemd/curator-web.container

# View detailed logs
journalctl --user -u curator-web.service -n 50 --no-pager
```

### API Proxy Not Working

```bash
# Test nginx config
podman exec curator-web nginx -t

# Check backend connectivity
podman exec curator-web curl http://curator:8950/health

# Verify network
podman network inspect engram-net
```

### High Memory Usage

```bash
# Check container stats
podman stats curator-web

# Restart container
systemctl --user restart curator-web.service

# Limit container memory (in Quadlet)
Memory=512M
MemorySwap=512M
```

### Build Failures

```bash
# Clear build cache
podman build --no-cache -t localhost/curator-web:latest -f deploy/Dockerfile .

# Check disk space
df -h

# Clear old images
podman image prune -a -f
```

## Performance Tuning

### Nginx Tuning

```nginx
# Worker processes
worker_processes auto;

# Worker connections
events {
    worker_connections 1024;
}

# Buffers
http {
    client_body_buffer_size 10K;
    client_header_buffer_size 1k;
    client_max_body_size 8m;
}
```

### Compression

Already enabled in nginx.conf:
- gzip compression
- Multiple content types
- Minimum size threshold

### Caching

```nginx
# Browser caching
location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
    expires 1y;
    add_header Cache-Control "public, immutable";
}
```

## Disaster Recovery

### Recovery Steps

1. **Restore from Git**:
   ```bash
   git clone https://github.com/yourusername/curator-web.git
   cd curator-web
   ```

2. **Restore Configuration**:
   ```bash
   cp ~/backups/.env.production .
   cp ~/backups/curator-web.container ~/.config/containers/systemd/
   ```

3. **Rebuild and Deploy**:
   ```bash
   ./deploy/deploy.sh
   ```

4. **Verify**:
   ```bash
   curl http://localhost:3100/
   systemctl --user status curator-web.service
   ```

### Rollback Procedure

```bash
# If current deployment fails, rollback to previous version

# 1. Tag before deployment
podman tag localhost/curator-web:latest localhost/curator-web:backup

# 2. If new deployment fails, restore backup
podman tag localhost/curator-web:backup localhost/curator-web:latest

# 3. Restart service
systemctl --user restart curator-web.service
```

## Production Checklist

Before deploying to production:

- [ ] Environment variables configured in `.env.production`
- [ ] API endpoints point to production backend
- [ ] HTTPS configured with valid certificates
- [ ] Security headers enabled in Caddy
- [ ] Monitoring and alerting configured
- [ ] Backups automated and tested
- [ ] Error logging configured
- [ ] Health checks working
- [ ] Performance tested (Lighthouse score > 90)
- [ ] Mobile responsiveness verified
- [ ] Cross-browser testing completed
- [ ] Documentation updated
- [ ] Rollback procedure tested
