# Architecture Documentation

This document describes the architecture, design patterns, and implementation details of the Curator Web frontend application.

## Table of Contents

- [Overview](#overview)
- [Component Hierarchy](#component-hierarchy)
- [Data Flow](#data-flow)
- [Routing Structure](#routing-structure)
- [State Management](#state-management)
- [Real-time Job Tracking](#real-time-job-tracking)
- [Error Handling](#error-handling)
- [Performance Optimizations](#performance-optimizations)

## Overview

Curator Web is a modern React application built with:

- **React 19**: Latest React features including concurrent rendering
- **TypeScript**: Full type safety across the application
- **Vite**: Fast build tool with Hot Module Replacement
- **React Query**: Server state management and caching
- **React Router**: Client-side routing
- **Tailwind CSS**: Utility-first styling

### Architecture Principles

1. **Type Safety First**: All API interactions, props, and state are fully typed
2. **Component Composition**: Small, reusable components over monolithic components
3. **Separation of Concerns**: Clear boundaries between UI, data fetching, and business logic
4. **Performance**: Efficient rendering with proper memoization and code splitting
5. **Accessibility**: WCAG 2.1 AA compliant using Radix UI primitives

## Component Hierarchy

### Application Root

```
App (ErrorBoundary + ThemeProvider + QueryClientProvider)
└── RouterProvider
    └── Layout
        ├── Header
        │   ├── Navigation
        │   └── ThemeToggle
        └── Outlet (Page Content)
            ├── DashboardPage
            ├── SubscriptionsPage
            ├── IngestedPage
            ├── ManualIngestPage
            └── SettingsPage
```

### Component Categories

#### 1. Layout Components (`src/components/layout/`)

**Header.tsx**
- Top navigation bar
- Application title
- Theme toggle
- User actions

**Navigation.tsx**
- Main navigation menu
- Active route highlighting
- Responsive mobile menu

**Layout.tsx**
- Page wrapper component
- Consistent spacing and structure
- Outlet for nested routes

#### 2. Page Components (`src/pages/`)

**DashboardPage.tsx**
- System overview dashboard
- Statistics and charts
- Recent activity feed
- Quick actions

**SubscriptionsPage.tsx**
- Subscription list with filtering
- Add/Edit/Delete subscription forms
- Bulk actions
- Pagination

**IngestedPage.tsx**
- Ingested items browser
- Advanced filtering options
- Item details modal
- Bulk operations

**ManualIngestPage.tsx**
- Manual fetch form
- Job status tracker
- Real-time progress updates
- Result display

**SettingsPage.tsx**
- Application settings
- User preferences
- API configuration

#### 3. Feature Components

**Dashboard Widgets** (`src/components/dashboard/`)
- `SystemStatus.tsx`: API/DB/Daemon health
- `SubscriptionStats.tsx`: Subscription metrics
- `IngestionStats.tsx`: Ingestion metrics
- `RecentActivity.tsx`: Activity timeline
- `ErrorLog.tsx`: Recent errors

**Subscription Components** (`src/components/subscriptions/`)
- `SubscriptionCard.tsx`: Individual subscription display
- `StatusBadge.tsx`: Visual status indicator

**Ingestion Components** (`src/components/ingestion/`)
- `JobTracker.tsx`: Real-time job monitoring
- `IngestedItemCard.tsx`: Item preview card

**Form Components** (`src/components/forms/`)
- `AddSubscriptionForm.tsx`: Create subscription
- `EditSubscriptionForm.tsx`: Update subscription

#### 4. UI Primitives (`src/components/ui/`)

Radix UI-based components with Tailwind styling:
- `button.tsx`: Button variants
- `input.tsx`: Text input
- `select.tsx`: Dropdown select
- `dialog.tsx`: Modal dialogs
- `table.tsx`: Data tables
- `form.tsx`: Form controls
- `badge.tsx`: Status badges
- `progress.tsx`: Progress bars
- And more...

#### 5. Utility Components

- `ErrorBoundary.tsx`: Catches and displays React errors
- `ErrorMessage.tsx`: Formatted error display
- `LoadingSkeleton.tsx`: Loading placeholders
- `EmptyState.tsx`: No data placeholders

## Data Flow

### Request Flow Diagram

```
┌─────────────────┐
│  React Component│
└────────┬────────┘
         │ 1. Renders, triggers hook
         ▼
┌─────────────────┐
│  Custom Hook    │  (useSubscriptions, useIngestedItems, etc.)
│  (React Query)  │
└────────┬────────┘
         │ 2. Calls query function
         ▼
┌─────────────────┐
│  CuratorClient  │  (src/api/client.ts)
│  API Client     │
└────────┬────────┘
         │ 3. HTTP Request
         ▼
┌─────────────────┐
│  Curator API    │  (Backend Service)
│  (FastAPI)      │
└────────┬────────┘
         │ 4. Database Query
         ▼
┌─────────────────┐
│  PostgreSQL     │
└─────────────────┘
```

### Response Flow

```
PostgreSQL → Curator API → CuratorClient → React Query Cache → React Component
                                                    │
                                                    ├─> Component A
                                                    ├─> Component B
                                                    └─> Component C
```

### Data Flow Implementation

#### 1. API Client Layer (`src/api/client.ts`)

The `CuratorClient` class provides type-safe methods for all API endpoints:

```typescript
class CuratorClient {
  // Subscription methods
  listSubscriptions(params?: ListSubscriptionsParams): Promise<SubscriptionResponse[]>
  getSubscription(id: number): Promise<SubscriptionResponse>
  createSubscription(data: SubscriptionCreate): Promise<SubscriptionResponse>
  updateSubscription(id: number, data: SubscriptionUpdate): Promise<SubscriptionResponse>
  deleteSubscription(id: number): Promise<void>

  // Ingestion methods
  listIngestedItems(params?: ListIngestedItemsParams): Promise<IngestedItemResponse[]>
  getIngestedItem(id: number): Promise<IngestedItemResponse>

  // Job methods
  triggerFetch(request: FetchJobRequest): Promise<FetchJobResponse>
  getJobStatus(jobId: string): Promise<FetchJobResponse>

  // System methods
  getStatus(): Promise<StatusResponse>
  getHealth(): Promise<HealthResponse>
}
```

**Key Features**:
- Centralized error handling with `CuratorAPIError`
- Automatic header injection (API key, Content-Type)
- Query parameter building
- Type-safe request/response handling

#### 2. React Query Hooks (`src/hooks/`)

Custom hooks wrap the API client with React Query:

**useSubscriptions.ts**
```typescript
export function useSubscriptions(params?: ListSubscriptionsParams) {
  return useQuery({
    queryKey: ['subscriptions', params],
    queryFn: () => curatorClient.listSubscriptions(params),
    staleTime: 60 * 1000, // 1 minute
  })
}
```

**useIngestedItems.ts**
```typescript
export function useIngestedItems(params?: ListIngestedItemsParams) {
  return useQuery({
    queryKey: ['ingested-items', params],
    queryFn: () => curatorClient.listIngestedItems(params),
  })
}
```

**useJobStatus.ts** (with polling)
```typescript
export function useJobStatus(jobId: string | null) {
  return useQuery({
    queryKey: ['job', jobId],
    queryFn: () => curatorClient.getJobStatus(jobId!),
    enabled: jobId !== null,
    refetchInterval: (query) => {
      const data = query.state.data
      // Poll every 5s for active jobs, stop for completed/failed
      if (data?.status === 'pending' || data?.status === 'in_progress') {
        return 5000
      }
      return false
    },
  })
}
```

#### 3. Mutation Hooks

For write operations, we use mutations:

```typescript
export function useCreateSubscription() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: SubscriptionCreate) =>
      curatorClient.createSubscription(data),
    onSuccess: () => {
      // Invalidate and refetch subscriptions
      queryClient.invalidateQueries({ queryKey: ['subscriptions'] })
    },
  })
}
```

## Routing Structure

### Route Configuration (`src/router.tsx`)

```typescript
const router = createBrowserRouter([
  {
    path: '/',
    element: <Layout />,
    children: [
      { index: true, element: <DashboardPage /> },
      { path: 'subscriptions', element: <SubscriptionsPage /> },
      { path: 'ingested', element: <IngestedPage /> },
      { path: 'manual', element: <ManualIngestPage /> },
      { path: 'settings', element: <SettingsPage /> },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
])
```

### Route Features

- **Nested Routing**: Layout wrapper for all pages
- **Client-Side Navigation**: No page reloads
- **Active Route Highlighting**: Visual indication of current page
- **404 Handling**: Catch-all route for unknown paths

### Navigation Patterns

```typescript
// Programmatic navigation
const navigate = useNavigate()
navigate('/subscriptions')

// Link component
<Link to="/ingested">View Items</Link>

// Search params
const [searchParams, setSearchParams] = useSearchParams()
searchParams.get('filter')
setSearchParams({ filter: 'active' })
```

## State Management

### State Management Strategy

We use a **hybrid approach** combining different state management tools:

#### 1. Server State (React Query)

**Used for**: API data, caching, background refetching

```typescript
const { data, isLoading, error, refetch } = useSubscriptions()
```

**Benefits**:
- Automatic caching with configurable stale time
- Background refetching
- Optimistic updates
- Request deduplication
- Automatic retries

#### 2. Local State (useState, useReducer)

**Used for**: Component-specific UI state

```typescript
const [isOpen, setIsOpen] = useState(false)
const [selectedItems, setSelectedItems] = useState<string[]>([])
```

#### 3. Form State (React Hook Form)

**Used for**: Form inputs and validation

```typescript
const form = useForm<SubscriptionCreate>({
  resolver: zodResolver(subscriptionSchema),
  defaultValues: {
    name: '',
    subscription_type: 'youtube_channel',
    source_url: '',
  },
})
```

#### 4. Theme State (Context)

**Used for**: Global theme preference

```typescript
const { theme, setTheme } = useTheme()
```

### State Colocation

We follow the principle of **state colocation**: keep state as close to where it's used as possible.

```
❌ Bad: Global state for modal open/close
✓ Good: Local state in component that renders modal

❌ Bad: Local state for API data
✓ Good: React Query for server state
```

## Real-time Job Tracking

### Implementation Overview

The job tracking system monitors long-running ingestion jobs with automatic polling.

### Flow Diagram

```
User submits URL
      ↓
Manual Fetch API Call
      ↓
Receive Job ID
      ↓
useJobStatus Hook
      ↓
Poll every 5 seconds ← (while status = pending/in_progress)
      ↓
Status: completed/failed
      ↓
Stop polling
      ↓
Display result
```

### Code Implementation

**1. Trigger Job**

```typescript
const mutation = useManualFetch()

const handleSubmit = async (data: { source_url: string }) => {
  const result = await mutation.mutateAsync(data)
  setJobId(result.job_id) // Start tracking
}
```

**2. Track Job Status**

```typescript
const { data: jobStatus } = useJobStatus(jobId)

// Hook automatically polls and stops when job completes
```

**3. Display Progress**

```typescript
<JobTracker jobId={jobId}>
  {jobStatus?.status === 'pending' && <Spinner />}
  {jobStatus?.status === 'in_progress' && <Progress />}
  {jobStatus?.status === 'completed' && <Success />}
  {jobStatus?.status === 'failed' && <Error />}
</JobTracker>
```

### Polling Strategy

```typescript
refetchInterval: (query) => {
  const data = query.state.data as FetchJobResponse | undefined

  // Continue polling for active jobs
  if (data?.status === 'pending' || data?.status === 'in_progress') {
    return 5000 // 5 seconds
  }

  // Stop polling when complete
  return false
}
```

**Benefits**:
- Automatic polling management
- Memory efficient (stops polling when done)
- Handles component unmount gracefully
- No manual cleanup required

## Error Handling

### Error Handling Layers

#### 1. API Client Level

```typescript
class CuratorAPIError extends Error {
  status?: number
  response?: any

  constructor(message: string, status?: number, response?: any) {
    super(message)
    this.name = 'CuratorAPIError'
    this.status = status
    this.response = response
  }
}
```

#### 2. React Query Level

```typescript
const { data, error, isError } = useSubscriptions()

if (isError) {
  return <ErrorMessage error={error} />
}
```

#### 3. Error Boundary Level

```typescript
<ErrorBoundary>
  <App />
</ErrorBoundary>
```

Catches unhandled React errors and displays fallback UI.

#### 4. Form Validation Level

```typescript
const schema = z.object({
  name: z.string().min(1, 'Name is required'),
  source_url: z.string().url('Must be a valid URL'),
})
```

### Error Display Patterns

**Inline Errors** (form fields):
```typescript
{errors.name && <span className="text-red-500">{errors.name.message}</span>}
```

**Alert Errors** (API failures):
```typescript
<Alert variant="destructive">
  <AlertTitle>Error</AlertTitle>
  <AlertDescription>{error.message}</AlertDescription>
</Alert>
```

**Toast Notifications** (success/error feedback):
```typescript
toast.success('Subscription created successfully')
toast.error('Failed to delete subscription')
```

## Performance Optimizations

### 1. Code Splitting

```typescript
// Lazy load page components
const DashboardPage = lazy(() => import('./pages/DashboardPage'))
```

### 2. React Query Caching

```typescript
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000, // 1 minute cache
      refetchOnWindowFocus: false, // Don't refetch on focus
    },
  },
})
```

### 3. Memoization

```typescript
const expensiveValue = useMemo(() => {
  return computeExpensiveValue(data)
}, [data])
```

### 4. Virtual Scrolling

For long lists, we use windowing (future enhancement):

```typescript
// Using react-virtual
const rowVirtualizer = useVirtualizer({
  count: items.length,
  getScrollElement: () => parentRef.current,
  estimateSize: () => 35,
})
```

### 5. Image Optimization

```typescript
// Lazy load images
<img loading="lazy" src={thumbnail} alt={title} />
```

### 6. Bundle Optimization

Vite automatically:
- Tree-shakes unused code
- Code splits routes
- Minifies production builds
- Generates optimized chunks

### Performance Metrics

Target metrics:
- **First Contentful Paint**: < 1.5s
- **Time to Interactive**: < 3.0s
- **Largest Contentful Paint**: < 2.5s
- **Cumulative Layout Shift**: < 0.1

## Design Patterns

### 1. Custom Hooks Pattern

Extract data fetching and business logic into custom hooks:

```typescript
// Instead of:
function Component() {
  const [data, setData] = useState(null)
  useEffect(() => {
    fetchData().then(setData)
  }, [])
}

// Use:
function Component() {
  const { data } = useSubscriptions()
}
```

### 2. Compound Components

For complex UI components:

```typescript
<Tabs>
  <TabsList>
    <TabsTrigger value="all">All</TabsTrigger>
    <TabsTrigger value="active">Active</TabsTrigger>
  </TabsList>
  <TabsContent value="all">...</TabsContent>
  <TabsContent value="active">...</TabsContent>
</Tabs>
```

### 3. Render Props (for flexibility)

```typescript
<DataFetcher>
  {({ data, loading, error }) => (
    loading ? <Loading /> : <Display data={data} />
  )}
</DataFetcher>
```

### 4. Controlled Components

Forms are fully controlled:

```typescript
<Input
  value={form.watch('name')}
  onChange={(e) => form.setValue('name', e.target.value)}
/>
```

## Testing Strategy (Recommended)

### Unit Tests
- Test utility functions
- Test custom hooks with `@testing-library/react-hooks`
- Test components with `@testing-library/react`

### Integration Tests
- Test page flows
- Test form submissions
- Test API interactions with MSW (Mock Service Worker)

### E2E Tests
- Test critical user journeys
- Use Playwright or Cypress

## Future Enhancements

1. **WebSocket Support**: Real-time updates without polling
2. **Offline Support**: Service worker for offline functionality
3. **Virtual Scrolling**: Better performance for large lists
4. **Progressive Web App**: Install as native app
5. **Advanced Filtering**: Filter builder UI
6. **Bulk Operations**: Select multiple items for batch actions
7. **Keyboard Shortcuts**: Power user productivity features
8. **Accessibility Improvements**: Full WCAG 2.1 AAA compliance
