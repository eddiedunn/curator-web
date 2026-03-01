# Curator Web Deployment Notes

## Deployment Summary

- **Container Image Tag**: `localhost/curator-web:latest`
- **Access URL**: https://curator-web.your-domain.example.com
- **Local Access**: http://localhost:3100

## Deployment Steps

1. Sync project to your server via rsync or git clone
2. Build the container image: `podman build -t curator-web:latest .`
3. Deploy Quadlet systemd configuration to `~/.config/containers/systemd/`
4. Start and verify the service

## Issues Encountered

### Issue 1: Network Not Found
- **Error**: `unable to find network with name or ID engram-net: network not found`
- **Root Cause**: The quadlet configuration referenced `engram-net` but the actual network name is `gpu-services`
- **Resolution**: Updated `curator-web.container` to use `Network=gpu-services`

## Configuration Details

### Quadlet Configuration (`~/.config/containers/systemd/curator-web.container`)
```ini
[Unit]
Description=Curator Web Frontend
After=curator.service

[Container]
Image=localhost/curator-web:latest
ContainerName=curator-web
Network=gpu-services
PublishPort=3100:80
HealthCmd=curl -f http://localhost/
HealthInterval=30s

[Service]
Restart=always
TimeoutStartSec=120

[Install]
WantedBy=default.target
```

### Caddy Reverse Proxy Configuration
Add to your Caddyfile:
```caddyfile
curator-web.your-domain.example.com {
    reverse_proxy localhost:3100 {
        header_up Host {host}
        header_up X-Real-IP {remote_host}
        header_up X-Forwarded-For {remote_host}
        header_up X-Forwarded-Proto https
        header_up X-Forwarded-Host {host}
    }
    header {
        X-Content-Type-Options nosniff
        X-Frame-Options SAMEORIGIN
        Referrer-Policy strict-origin-when-cross-origin
        -Server
    }
    encode gzip
    log {
        output file /var/log/caddy/curator-web-access.log {
            roll_size 100mb
            roll_keep 5
        }
        format json
    }
}
```

## Performance Observations

- **Container Build Time**: ~3 seconds (using cached layers)
- **Container Startup Time**: <1 second
- **Health Check**: Container reports healthy within 30 seconds
- **Response Time**: Nginx serves static assets efficiently

## Service Status

```
● curator-web.service - Curator Web Frontend
     Loaded: loaded (~/.config/containers/systemd/curator-web.container; generated)
     Active: active (running)
```

## Backend Integration

- **Curator API**: Running on port 8950, healthy
- **API Status**: `{"status":"healthy","version":"0.1.0","database_connected":true,"daemon_running":true}`
- **Subscriptions**: 1 active subscription configured
- **Network**: Using `gpu-services` podman network for container communication

## Verification Commands

```bash
# Check service status
systemctl --user status curator-web.service

# View container logs
podman logs curator-web --tail 50

# Test health endpoint
curl -f http://localhost:3100/

# Test via Caddy proxy
curl -k https://curator-web.your-domain.example.com/
```

## Notes

- The nginx container within curator-web handles SPA routing (try_files for React Router)
- API calls from the frontend go to the Curator API at port 8950
- TLS certificates are managed by Caddy using ACME
