# API Documentation

This document describes the CuratorClient API, endpoint reference, authentication, and error handling patterns for the Curator Web frontend.

## Table of Contents

- [Overview](#overview)
- [CuratorClient API](#curatorclient-api)
- [API Endpoints Reference](#api-endpoints-reference)
- [Authentication](#authentication)
- [Error Handling](#error-handling)
- [Type Definitions](#type-definitions)
- [Usage Examples](#usage-examples)

## Overview

The Curator Web frontend communicates with the Curator API backend through a type-safe HTTP client called `CuratorClient`. This client provides:

- Full TypeScript type safety
- Automatic error handling
- Optional API key authentication
- Query parameter building
- Centralized configuration

### Base Configuration

```typescript
import { CuratorClient } from './api/client'

// Using environment variables (recommended)
const client = new CuratorClient()

// Custom configuration
const client = new CuratorClient({
  baseUrl: 'https://api.curator.yourdomain.com',
  apiKey: 'your-api-key-here'
})
```

### Environment Variables

```env
VITE_CURATOR_API_URL=http://localhost:8950
VITE_CURATOR_API_KEY=optional-api-key
```

## CuratorClient API

### Constructor

```typescript
class CuratorClient {
  constructor(config?: CuratorClientConfig)
}

interface CuratorClientConfig {
  baseUrl?: string  // Default: env.VITE_CURATOR_API_URL || 'http://localhost:8950'
  apiKey?: string   // Default: env.VITE_CURATOR_API_KEY
}
```

### Subscription Methods

#### listSubscriptions()

Retrieve all subscriptions with optional filtering.

```typescript
listSubscriptions(params?: ListSubscriptionsParams): Promise<SubscriptionResponse[]>

interface ListSubscriptionsParams {
  enabled_only?: boolean
  subscription_type?: string
}
```

**Example**:
```typescript
// Get all subscriptions
const subscriptions = await client.listSubscriptions()

// Get only enabled subscriptions
const enabled = await client.listSubscriptions({ enabled_only: true })

// Get YouTube subscriptions only
const youtube = await client.listSubscriptions({
  subscription_type: 'youtube_channel'
})
```

#### getSubscription()

Retrieve a specific subscription by ID.

```typescript
getSubscription(id: number): Promise<SubscriptionResponse>
```

**Example**:
```typescript
const subscription = await client.getSubscription(123)
console.log(subscription.name) // "Tech Channel"
```

#### createSubscription()

Create a new subscription.

```typescript
createSubscription(data: SubscriptionCreate): Promise<SubscriptionResponse>

interface SubscriptionCreate {
  name: string
  subscription_type: 'youtube_channel' | 'rss_feed' | 'podcast'
  source_url: string
  check_frequency_minutes?: number
  enabled?: boolean
  metadata?: Record<string, any>
}
```

**Example**:
```typescript
const newSubscription = await client.createSubscription({
  name: "Tech Channel",
  subscription_type: "youtube_channel",
  source_url: "https://www.youtube.com/channel/UCxxxxx",
  check_frequency_minutes: 60,
  enabled: true
})
```

#### updateSubscription()

Update an existing subscription.

```typescript
updateSubscription(
  id: number,
  data: SubscriptionUpdate
): Promise<SubscriptionResponse>

interface SubscriptionUpdate {
  name?: string
  subscription_type?: string
  source_url?: string
  check_frequency_minutes?: number
  enabled?: boolean
  metadata?: Record<string, any>
}
```

**Example**:
```typescript
const updated = await client.updateSubscription(123, {
  enabled: false,
  check_frequency_minutes: 120
})
```

#### deleteSubscription()

Delete a subscription.

```typescript
deleteSubscription(id: number): Promise<void>
```

**Example**:
```typescript
await client.deleteSubscription(123)
```

### Ingested Items Methods

#### listIngestedItems()

Retrieve ingested items with optional filtering.

```typescript
listIngestedItems(params?: ListIngestedItemsParams): Promise<IngestedItemResponse[]>

interface ListIngestedItemsParams {
  subscription_id?: number
  source_type?: string
  status?: string
  limit?: number
  offset?: number
}
```

**Example**:
```typescript
// Get all items
const items = await client.listIngestedItems()

// Get items from specific subscription
const subItems = await client.listIngestedItems({
  subscription_id: 123
})

// Paginated results
const page1 = await client.listIngestedItems({
  limit: 50,
  offset: 0
})

// Filter by status
const completed = await client.listIngestedItems({
  status: 'completed'
})
```

#### getIngestedItem()

Retrieve a specific ingested item by ID.

```typescript
getIngestedItem(id: number): Promise<IngestedItemResponse>
```

**Example**:
```typescript
const item = await client.getIngestedItem(456)
console.log(item.title) // "Introduction to TypeScript"
```

### Manual Fetch Methods

#### triggerFetch()

Trigger a manual fetch/ingestion job.

```typescript
triggerFetch(request: FetchJobRequest): Promise<FetchJobResponse>

interface FetchJobRequest {
  source_url: string
  subscription_id?: string
}
```

**Example**:
```typescript
const job = await client.triggerFetch({
  source_url: "https://www.youtube.com/watch?v=xxxxx"
})

console.log(job.job_id) // "job-123-abc"
console.log(job.status) // "pending"
```

#### getJobStatus()

Get the status of a fetch/ingestion job.

```typescript
getJobStatus(jobId: string): Promise<FetchJobResponse>
```

**Example**:
```typescript
const status = await client.getJobStatus("job-123-abc")
console.log(status.status) // "in_progress" | "completed" | "failed"
console.log(status.message) // "Processing video..."
```

### System Methods

#### getStatus()

Get system status information.

```typescript
getStatus(): Promise<StatusResponse>
```

**Example**:
```typescript
const status = await client.getStatus()
console.log(status.database_connected) // true
console.log(status.daemon_running) // true
console.log(status.total_subscriptions) // 15
```

#### getHealth()

Get health check information.

```typescript
getHealth(): Promise<HealthResponse>
```

**Example**:
```typescript
const health = await client.getHealth()
console.log(health.status) // "healthy"
console.log(health.uptime_seconds) // 86400
```

## API Endpoints Reference

### Subscription Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/subscriptions` | List all subscriptions |
| GET | `/api/subscriptions?enabled_only=true` | List enabled subscriptions |
| GET | `/api/subscriptions?subscription_type=youtube_channel` | Filter by type |
| GET | `/api/subscriptions/{id}` | Get subscription by ID |
| POST | `/api/subscriptions` | Create new subscription |
| PUT | `/api/subscriptions/{id}` | Update subscription |
| DELETE | `/api/subscriptions/{id}` | Delete subscription |

### Ingested Items Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/items` | List all ingested items |
| GET | `/api/items?subscription_id={id}` | Filter by subscription |
| GET | `/api/items?status=completed` | Filter by status |
| GET | `/api/items?limit=50&offset=0` | Paginated results |
| GET | `/api/items/{id}` | Get item by ID |

### Manual Fetch Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/fetch` | Trigger manual fetch job |
| GET | `/api/fetch/{job_id}` | Get job status |

### System Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/status` | Get system status |
| GET | `/api/health` | Health check |

## Authentication

### API Key Authentication (Optional)

The Curator API supports optional API key authentication using the `X-API-Key` header.

#### Configuration

```typescript
// Environment variable
VITE_CURATOR_API_KEY=your-secret-api-key

// Or programmatically
const client = new CuratorClient({
  apiKey: 'your-secret-api-key'
})
```

#### How It Works

```typescript
// Headers automatically include API key if configured
{
  'Content-Type': 'application/json',
  'X-API-Key': 'your-secret-api-key'  // Added automatically
}
```

#### Security Best Practices

1. **Never commit API keys to version control**:
   ```bash
   echo ".env*" >> .gitignore
   ```

2. **Use different keys for dev/prod**:
   ```env
   # .env.development
   VITE_CURATOR_API_KEY=dev-key-12345

   # .env.production
   VITE_CURATOR_API_KEY=prod-key-67890
   ```

3. **Rotate keys regularly**:
   ```bash
   # Update API key in environment
   # Rebuild application
   bun run build
   ```

4. **Use environment-specific keys**:
   - Development: Less restrictive
   - Staging: Similar to production
   - Production: Most restrictive, rotated frequently

## Error Handling

### CuratorAPIError Class

All API errors are thrown as `CuratorAPIError` instances:

```typescript
class CuratorAPIError extends Error {
  name: 'CuratorAPIError'
  message: string        // Error message
  status?: number        // HTTP status code
  response?: any         // Raw API response
}
```

### Error Handling Patterns

#### Try-Catch Pattern

```typescript
try {
  const subscription = await client.getSubscription(123)
} catch (error) {
  if (error instanceof CuratorAPIError) {
    console.error('API Error:', error.message)
    console.error('Status:', error.status)
    console.error('Response:', error.response)
  } else {
    console.error('Unknown error:', error)
  }
}
```

#### React Query Pattern

```typescript
const { data, error, isError } = useQuery({
  queryKey: ['subscription', id],
  queryFn: () => client.getSubscription(id)
})

if (isError) {
  return <ErrorMessage error={error} />
}
```

#### Mutation Pattern

```typescript
const mutation = useMutation({
  mutationFn: (data) => client.createSubscription(data),
  onError: (error) => {
    if (error instanceof CuratorAPIError) {
      if (error.status === 409) {
        toast.error('Subscription already exists')
      } else {
        toast.error(error.message)
      }
    }
  }
})
```

### Common HTTP Status Codes

| Status | Meaning | Example |
|--------|---------|---------|
| 200 | Success | Subscription retrieved |
| 201 | Created | Subscription created |
| 204 | No Content | Subscription deleted |
| 400 | Bad Request | Invalid input data |
| 401 | Unauthorized | Invalid API key |
| 404 | Not Found | Subscription not found |
| 409 | Conflict | Duplicate subscription |
| 422 | Validation Error | Invalid field values |
| 500 | Server Error | Internal server error |
| 503 | Service Unavailable | Backend is down |

### Error Response Format

```typescript
// Standard error response
{
  "detail": "Subscription not found",
  "status": 404
}

// Validation error response
{
  "detail": [
    {
      "loc": ["body", "source_url"],
      "msg": "field required",
      "type": "value_error.missing"
    }
  ]
}
```

### Error Handling Utilities

```typescript
// Extract error message
function getErrorMessage(error: unknown): string {
  if (error instanceof CuratorAPIError) {
    return error.message
  }
  if (error instanceof Error) {
    return error.message
  }
  return 'An unknown error occurred'
}

// Check specific error status
function isNotFoundError(error: unknown): boolean {
  return error instanceof CuratorAPIError && error.status === 404
}

// Retry logic
async function fetchWithRetry<T>(
  fn: () => Promise<T>,
  maxRetries = 3
): Promise<T> {
  let lastError: Error | null = null

  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn()
    } catch (error) {
      lastError = error as Error
      if (error instanceof CuratorAPIError && error.status < 500) {
        // Don't retry client errors
        throw error
      }
      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)))
    }
  }

  throw lastError
}
```

## Type Definitions

### Subscription Types

```typescript
type SubscriptionType = 'youtube_channel' | 'rss_feed' | 'podcast'
type SubscriptionStatus = 'active' | 'paused' | 'error'

interface SubscriptionResponse {
  id: string
  name: string
  subscription_type: SubscriptionType
  source_url: string
  check_frequency_minutes: number
  enabled: boolean
  status: SubscriptionStatus
  last_checked_at?: string
  last_error?: string
  created_at: string
  updated_at: string
  metadata?: Record<string, any>
}
```

### Ingested Item Types

```typescript
type IngestionStatus = 'pending' | 'in_progress' | 'completed' | 'failed'

interface IngestedItemResponse {
  id: string
  subscription_id?: string
  source_type: string
  source_id: string
  source_url: string
  title: string
  author?: string
  published_at?: string
  ingested_at: string
  chunk_count: number
  status: IngestionStatus
  error_message?: string
  metadata?: Record<string, any>
}
```

### Job Status Types

```typescript
interface FetchJobResponse {
  job_id: string
  source_url: string
  status: IngestionStatus
  message: string
}
```

### System Status Types

```typescript
interface StatusResponse {
  status: string
  version: string
  uptime_seconds: number
  database_connected: boolean
  daemon_running: boolean
  total_subscriptions: number
  enabled_subscriptions: number
  total_items: number
}

interface HealthResponse {
  status: string
  version: string
  uptime_seconds: number
  database_connected: boolean
  daemon_running: boolean
}
```

## Usage Examples

### Example 1: Create Subscription with Error Handling

```typescript
import { curatorClient } from './api/client'
import { toast } from 'sonner'

async function createYouTubeSubscription(url: string, name: string) {
  try {
    const subscription = await curatorClient.createSubscription({
      name,
      subscription_type: 'youtube_channel',
      source_url: url,
      check_frequency_minutes: 60,
      enabled: true
    })

    toast.success(`Subscription "${subscription.name}" created!`)
    return subscription
  } catch (error) {
    if (error instanceof CuratorAPIError) {
      if (error.status === 409) {
        toast.error('This channel is already subscribed')
      } else {
        toast.error(`Failed to create subscription: ${error.message}`)
      }
    }
    throw error
  }
}
```

### Example 2: List Subscriptions with Filtering

```typescript
import { useQuery } from '@tanstack/react-query'
import { curatorClient } from './api/client'

function SubscriptionList() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['subscriptions', { enabled_only: true }],
    queryFn: () => curatorClient.listSubscriptions({ enabled_only: true }),
    staleTime: 60 * 1000, // 1 minute
  })

  if (isLoading) return <div>Loading...</div>
  if (error) return <div>Error: {error.message}</div>

  return (
    <ul>
      {data?.map(sub => (
        <li key={sub.id}>{sub.name}</li>
      ))}
    </ul>
  )
}
```

### Example 3: Manual Fetch with Job Tracking

```typescript
import { useState } from 'react'
import { curatorClient } from './api/client'
import { useJobStatus } from './hooks/useJobStatus'

function ManualFetch() {
  const [jobId, setJobId] = useState<string | null>(null)
  const { data: jobStatus } = useJobStatus(jobId)

  const handleFetch = async (url: string) => {
    try {
      const job = await curatorClient.triggerFetch({ source_url: url })
      setJobId(job.job_id)
    } catch (error) {
      console.error('Failed to trigger fetch:', error)
    }
  }

  return (
    <div>
      <button onClick={() => handleFetch('https://example.com')}>
        Fetch
      </button>

      {jobStatus && (
        <div>
          Status: {jobStatus.status}
          <br />
          Message: {jobStatus.message}
        </div>
      )}
    </div>
  )
}
```

### Example 4: Update Subscription

```typescript
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { curatorClient } from './api/client'

function useUpdateSubscription() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: {
      id: number
      data: SubscriptionUpdate
    }) => curatorClient.updateSubscription(id, data),

    onSuccess: (_, variables) => {
      // Invalidate and refetch
      queryClient.invalidateQueries({
        queryKey: ['subscriptions']
      })
      queryClient.invalidateQueries({
        queryKey: ['subscription', variables.id]
      })
    },
  })
}

// Usage
function ToggleSubscription({ id, enabled }: { id: number, enabled: boolean }) {
  const mutation = useUpdateSubscription()

  const toggle = () => {
    mutation.mutate({
      id,
      data: { enabled: !enabled }
    })
  }

  return (
    <button onClick={toggle} disabled={mutation.isPending}>
      {enabled ? 'Disable' : 'Enable'}
    </button>
  )
}
```

### Example 5: Paginated Items

```typescript
import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { curatorClient } from './api/client'

function PaginatedItems() {
  const [page, setPage] = useState(0)
  const limit = 50

  const { data, isLoading } = useQuery({
    queryKey: ['items', { limit, offset: page * limit }],
    queryFn: () => curatorClient.listIngestedItems({
      limit,
      offset: page * limit
    }),
    keepPreviousData: true, // Keep old data while fetching new
  })

  return (
    <div>
      {data?.map(item => (
        <div key={item.id}>{item.title}</div>
      ))}

      <button
        onClick={() => setPage(p => Math.max(0, p - 1))}
        disabled={page === 0}
      >
        Previous
      </button>

      <button
        onClick={() => setPage(p => p + 1)}
        disabled={!data || data.length < limit}
      >
        Next
      </button>
    </div>
  )
}
```

### Example 6: System Health Check

```typescript
import { useQuery } from '@tanstack/react-query'
import { curatorClient } from './api/client'

function SystemHealth() {
  const { data } = useQuery({
    queryKey: ['health'],
    queryFn: () => curatorClient.getHealth(),
    refetchInterval: 30000, // Check every 30 seconds
  })

  const isHealthy =
    data?.status === 'healthy' &&
    data?.database_connected &&
    data?.daemon_running

  return (
    <div className={isHealthy ? 'text-green-600' : 'text-red-600'}>
      {isHealthy ? '✓ System Healthy' : '✗ System Unhealthy'}
    </div>
  )
}
```

## Rate Limiting

The API may implement rate limiting. Handle rate limit errors:

```typescript
try {
  const subscriptions = await client.listSubscriptions()
} catch (error) {
  if (error instanceof CuratorAPIError && error.status === 429) {
    // Too Many Requests
    const retryAfter = error.response?.headers?.['Retry-After']
    console.log(`Rate limited. Retry after ${retryAfter} seconds`)
  }
}
```

## CORS Configuration

For development with different origins, ensure the backend has CORS enabled:

```python
# Backend CORS configuration
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],  # Vite dev server
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

## Testing the API

### Manual Testing with curl

```bash
# List subscriptions
curl http://localhost:8950/api/subscriptions

# Create subscription
curl -X POST http://localhost:8950/api/subscriptions \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Channel",
    "subscription_type": "youtube_channel",
    "source_url": "https://youtube.com/channel/xxx"
  }'

# Get health status
curl http://localhost:8950/api/health

# With API key
curl http://localhost:8950/api/subscriptions \
  -H "X-API-Key: your-api-key"
```

### Testing with React Query DevTools

Install and use React Query DevTools for debugging:

```typescript
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <YourApp />
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  )
}
```

## Best Practices

1. **Use React Query hooks** instead of direct API calls
2. **Implement proper error handling** for all API calls
3. **Use TypeScript types** for compile-time safety
4. **Cache API responses** appropriately with React Query
5. **Implement retry logic** for transient failures
6. **Use optimistic updates** for better UX
7. **Handle loading states** in the UI
8. **Display meaningful error messages** to users
9. **Invalidate queries** after mutations
10. **Use query keys consistently** for proper caching
