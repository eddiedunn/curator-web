# Curator Web Frontend

A modern, responsive web interface for the Curator content aggregation system. Built with React 19, TypeScript, and Vite, this frontend provides a seamless experience for managing subscriptions, monitoring ingestion jobs, and browsing curated content.

## Features

- **Subscription Management**: Create, edit, and manage YouTube, RSS, and podcast subscriptions
- **Real-time Job Tracking**: Monitor ingestion jobs with automatic status polling
- **Content Browser**: Browse and search ingested items with filtering options
- **Manual Ingestion**: Trigger one-off content fetches from any supported URL
- **System Dashboard**: View system health, statistics, and recent activity
- **Responsive Design**: Works seamlessly on desktop, tablet, and mobile devices
- **Dark Mode Support**: Built-in theme switching with system preference detection

## Screenshots & Layout

```
┌─────────────────────────────────────────────────────────────┐
│  Curator Web                            [Dashboard] [Theme] │
├─────────────────────────────────────────────────────────────┤
│  [Dashboard] [Subscriptions] [Ingested] [Manual] [Settings] │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  System Status                    Recent Activity            │
│  ┌─────────────────┐             ┌──────────────────┐       │
│  │ ✓ API: Healthy  │             │ Video ingested   │       │
│  │ ✓ DB: Connected │             │ 2 minutes ago    │       │
│  │ ✓ Daemon: Up    │             ├──────────────────┤       │
│  └─────────────────┘             │ Subscription     │       │
│                                   │ added            │       │
│  Subscription Stats               │ 5 minutes ago    │       │
│  ┌─────────────────┐             └──────────────────┘       │
│  │ Active: 12      │                                         │
│  │ Total: 15       │             Ingestion Stats             │
│  │ Items: 1,234    │             ┌──────────────────┐       │
│  └─────────────────┘             │ Today: 45        │       │
│                                   │ This Week: 312   │       │
│                                   │ Success Rate: 98%│       │
│                                   └──────────────────┘       │
└─────────────────────────────────────────────────────────────┘
```

## Prerequisites

Before you begin, ensure you have the following installed:

- **[Bun](https://bun.sh)** (v1.0+) - Fast JavaScript runtime and package manager
- **[Podman](https://podman.io)** (for production deployment) - Container runtime
- **Curator API** - The backend service must be running and accessible

## Development Setup

### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/curator-web.git
cd curator-web
```

### 2. Install Dependencies

```bash
bun install
```

This will install all required dependencies using Bun's fast package manager.

### 3. Configure Environment Variables

```bash
cp .env.example .env.development
# Edit .env.development with your configuration
```

The `.env.example` file contains all available environment variables with documentation. Key variables:
- `VITE_CURATOR_API_URL`: URL of the Curator API backend (default: `http://localhost:8950`)
- `VITE_CURATOR_API_KEY`: Optional API key for authenticated requests
- `VITE_ENGRAM_WEB_URL`: URL to Engram web UI for cross-linking (default: `http://localhost:5173`)

### 4. Start Development Server

```bash
bun run dev
```

The application will be available at `http://localhost:5173`

The dev server includes:
- Hot Module Replacement (HMR) for instant updates
- TypeScript type checking
- Automatic browser refresh

## Production Deployment

### 1. Build Docker Image

```bash
cd /path/to/curator-web
podman build -t localhost/curator-web:latest -f deploy/Dockerfile .
```

The Dockerfile uses a multi-stage build:
- **Stage 1**: Builds the application using Bun
- **Stage 2**: Serves static files with nginx

### 2. Deploy with Quadlet

The project includes a Quadlet configuration for systemd integration:

```bash
# Run the deployment script
./deploy/deploy.sh
```

Or manually:

```bash
# Copy Quadlet file to systemd directory
mkdir -p ~/.config/containers/systemd
cp deploy/curator-web.container ~/.config/containers/systemd/

# Reload systemd and start service
systemctl --user daemon-reload
systemctl --user restart curator-web.service
```

### 3. Update Caddy Configuration

Add a reverse proxy configuration to your Caddyfile:

```
curator.yourdomain.com {
    reverse_proxy localhost:3100

    encode gzip

    log {
        output file /var/log/caddy/curator-web.log
    }
}
```

Reload Caddy:

```bash
sudo systemctl reload caddy
```

### 4. Access via Tailscale DNS

If using Tailscale for secure access:

```bash
# Configure Tailscale DNS
tailscale cert curator.yourdomain.ts.net

# Update Caddy to use Tailscale cert
curator.yourdomain.ts.net {
    reverse_proxy localhost:3100
}
```

Access your application at: `https://curator.yourdomain.ts.net`

## Configuration Options

### Environment Variables

Create `.env.production` for production builds:

```env
VITE_CURATOR_API_URL=https://api.curator.yourdomain.com
VITE_CURATOR_API_KEY=your-production-api-key
VITE_APP_NAME=Curator
```

### Runtime Configuration

The application configuration is embedded during build time. To change configuration:

1. Update environment variables
2. Rebuild the Docker image
3. Restart the service

## Integration with Engram Web UI

Curator Web is designed to work seamlessly with the Engram ecosystem:

### Network Configuration

Both services should be on the same Podman network:

```bash
podman network create engram-net
```

The Quadlet configuration automatically connects to `engram-net`.

### API Communication

The frontend communicates with Curator API through:
- Direct API calls in development
- Nginx proxy in production (`/api/` routes)

### Data Flow

```
User Browser → Curator Web → Nginx Proxy → Curator API → PostgreSQL
                    ↓
                React Query Cache (60s)
```

## Troubleshooting Common Issues

### Issue: API Connection Failed

**Symptoms**: "Failed to fetch" errors, red system status

**Solutions**:
1. Verify Curator API is running: `curl http://localhost:8950/health`
2. Check `VITE_CURATOR_API_URL` in `.env.development`
3. Ensure network connectivity between containers
4. Check firewall rules and port bindings

### Issue: Build Fails

**Symptoms**: TypeScript errors, dependency issues

**Solutions**:
1. Clear Bun cache: `rm -rf node_modules && bun install`
2. Check TypeScript version: `bun run build`
3. Verify all dependencies are installed
4. Check for conflicting global packages

### Issue: Container Won't Start

**Symptoms**: Service fails immediately after start

**Solutions**:
1. Check logs: `journalctl --user -u curator-web.service -n 50`
2. Verify image exists: `podman images | grep curator-web`
3. Check port conflicts: `netstat -tuln | grep 3100`
4. Verify Quadlet file syntax: `cat ~/.config/containers/systemd/curator-web.container`

### Issue: Nginx 502 Bad Gateway

**Symptoms**: Application loads but API calls fail

**Solutions**:
1. Verify Curator API container name: `podman ps | grep curator`
2. Check network connectivity: `podman network inspect engram-net`
3. Verify nginx configuration: `podman exec curator-web cat /etc/nginx/conf.d/default.conf`
4. Check nginx logs: `podman logs curator-web`

### Issue: Environment Variables Not Working

**Symptoms**: API URL defaults to localhost

**Solutions**:
1. Environment variables must be set at build time
2. Rebuild after changing `.env.production`
3. Verify variables are prefixed with `VITE_`
4. Check build logs for variable substitution

### Issue: Dark Mode Not Persisting

**Symptoms**: Theme resets on page reload

**Solutions**:
1. Check browser localStorage permissions
2. Clear browser cache and cookies
3. Verify theme-provider is properly initialized
4. Check browser console for errors

## Project Structure

```
curator-web/
├── src/
│   ├── api/              # API client and type definitions
│   │   ├── client.ts     # CuratorClient class
│   │   └── types.ts      # TypeScript interfaces
│   ├── components/       # React components
│   │   ├── ui/           # Reusable UI components
│   │   ├── forms/        # Form components
│   │   ├── layout/       # Layout components
│   │   ├── dashboard/    # Dashboard widgets
│   │   ├── subscriptions/# Subscription components
│   │   └── ingestion/    # Ingestion tracking
│   ├── hooks/            # Custom React hooks
│   │   ├── useApi.ts     # Generic API hook
│   │   ├── useSubscriptions.ts
│   │   ├── useIngestedItems.ts
│   │   └── useJobStatus.ts
│   ├── pages/            # Page components
│   ├── lib/              # Utility functions
│   ├── App.tsx           # Root component
│   ├── router.tsx        # Route definitions
│   └── main.tsx          # Entry point
├── deploy/               # Deployment files
│   ├── Dockerfile        # Multi-stage Docker build
│   ├── nginx.conf        # Nginx configuration
│   ├── curator-web.container  # Quadlet config
│   └── deploy.sh         # Deployment script
├── docs/                 # Documentation
│   ├── ARCHITECTURE.md   # Architecture details
│   ├── DEPLOYMENT.md     # Deployment guide
│   └── API.md            # API documentation
└── package.json          # Dependencies

```

## Technologies Used

- **[Vite](https://vitejs.dev)** - Next-generation frontend build tool
- **[React 19](https://react.dev)** - JavaScript library for building user interfaces
- **[TypeScript](https://www.typescriptlang.org)** - Type-safe JavaScript
- **[React Router](https://reactrouter.com)** - Client-side routing
- **[React Query](https://tanstack.com/query)** - Data fetching and caching
- **[Tailwind CSS](https://tailwindcss.com)** - Utility-first CSS framework
- **[Radix UI](https://www.radix-ui.com)** - Accessible component primitives
- **[Lucide Icons](https://lucide.dev)** - Beautiful icon library
- **[React Hook Form](https://react-hook-form.com)** - Performant form library
- **[Zod](https://zod.dev)** - TypeScript-first schema validation

## Development Commands

```bash
# Start development server
bun run dev

# Build for production
bun run build

# Preview production build locally
bun run preview

# Type check without building
tsc --noEmit

# Lint code (if configured)
bun run lint
```

## Additional Documentation

- **[Architecture Guide](docs/ARCHITECTURE.md)** - Component hierarchy, data flow, and design patterns
- **[Deployment Guide](docs/DEPLOYMENT.md)** - Production deployment, monitoring, and maintenance
- **[API Reference](docs/API.md)** - CuratorClient methods and API endpoints

## Contributing

Follow the project structure and coding conventions:

1. Use TypeScript strict mode for all new code
2. Follow the existing component patterns
3. Use Tailwind CSS for styling (no custom CSS unless necessary)
4. Write type-safe API calls using the CuratorClient
5. Use React Hook Form for all forms
6. Implement proper error handling and loading states

## License

[Your License Here]

## Support

For issues and questions:
- GitHub Issues: [Your Repo URL]
- Documentation: [Your Docs URL]
- Email: [Your Email]
