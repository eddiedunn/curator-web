# Error Monitoring Setup

## Recommended Solution: Sentry

### Installation
```bash
bun add @sentry/react @sentry/vite-plugin
```

### Configuration

**1. Update vite.config.ts:**
```typescript
import { sentryVitePlugin } from "@sentry/vite-plugin";

export default defineConfig({
  plugins: [
    react(),
    sentryVitePlugin({
      org: "your-org",
      project: "curator-web",
      authToken: process.env.SENTRY_AUTH_TOKEN,
    }),
  ],
});
```

**2. Initialize in main.tsx:**
```typescript
import * as Sentry from "@sentry/react";

if (import.meta.env.PROD) {
  Sentry.init({
    dsn: import.meta.env.VITE_SENTRY_DSN,
    environment: "production",
    integrations: [
      new Sentry.BrowserTracing(),
      new Sentry.Replay(),
    ],
    tracesSampleRate: 0.1,
    replaysSessionSampleRate: 0.1,
    replaysOnErrorSampleRate: 1.0,
  });
}
```

**3. Add ErrorBoundary:**
```typescript
<Sentry.ErrorBoundary fallback={<ErrorFallback />}>
  <App />
</Sentry.ErrorBoundary>
```

### Environment Variables
```bash
VITE_SENTRY_DSN=https://xxx@yyy.ingest.sentry.io/zzz
SENTRY_AUTH_TOKEN=your-auth-token  # For source maps
```

## Alternative: Custom Error Logging

If you don't want to use Sentry, implement custom error boundary:

```typescript
// src/components/ErrorBoundary.tsx
class ErrorBoundary extends React.Component {
  componentDidCatch(error, errorInfo) {
    // Send to your logging service
    fetch('/api/log-error', {
      method: 'POST',
      body: JSON.stringify({ error, errorInfo }),
    });
  }
}
```

## Testing

Trigger test error:
```typescript
<button onClick={() => { throw new Error('Test error') }}>
  Test Error Monitoring
</button>
```

## Verification

- Documentation files created
- Clear instructions provided
- Multiple monitoring options covered
