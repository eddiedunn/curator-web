# Curator Web - Manual Testing Issues

## Critical Bugs (Fixed)

### 1. API Endpoint Path Mismatch
**Status:** Fixed
**Description:** Frontend API client was using `/api/` prefix but backend uses `/api/v1/` prefix.
**Affected Components:** All API calls
**Fix:** Updated `src/api/client.ts` to use correct paths:
- `/api/subscriptions` -> `/api/v1/subscriptions`
- `/api/items` -> `/api/v1/ingested`
- `/api/fetch` -> `/api/v1/fetch`
- `/api/status` -> `/api/v1/status`
- `/api/health` -> `/health` (no prefix)

### 2. HTTP Method Mismatch for Update
**Status:** Fixed
**Description:** Frontend used `PUT` for subscription updates, but backend uses `PATCH`.
**Affected Components:** `useUpdateSubscription` hook
**Fix:** Changed method from `PUT` to `PATCH` in `updateSubscription` function.

## Medium Bugs (Known Issues)

### 3. ID Type Mismatch
**Status:** Known Issue
**Description:** TypeScript types define `id` as `string` but backend returns `number` (integer).
**Affected Components:**
- `SubscriptionResponse.id`
- `IngestedItemResponse.id`
- Various components using `parseInt(sub.id)` or `String(id)` for comparisons
**Impact:** Works at runtime due to JavaScript loose typing, but is type-unsafe.
**Recommendation:** Update types to use `number` for IDs or convert at API boundary.

### 4. Manual Ingest Page Link Incorrect
**Status:** Fixed
**Description:** Dashboard "Manual Ingest" button navigates to `/manual-ingest` but route is `/manual`.
**Affected Components:** `DashboardPage.tsx` line 60
**Fix:** Changed navigation path from `/manual-ingest` to `/manual`.

## Low Priority Bugs

### 5. PostCSS Warning
**Status:** Known Issue
**Description:** PostCSS plugin warning about missing `from` option.
**Impact:** No functional impact, just a console warning.

### 6. "View in Engram" Link Missing
**Status:** Not Implemented
**Description:** The test checklist mentions "View in Engram" link for ingested items, but this feature doesn't appear to be implemented.
**Recommendation:** Add Engram URL configuration and link in `IngestedItemCard`.

## Testing Notes

### Dashboard Features
- [x] System status displays correctly when API is running
- [x] Statistics load from API
- [x] Recent activity component present (needs data)
- [x] Error log component present (needs subscriptions with errors)
- [x] Auto-refresh configured (30s interval)

### Subscription Management
- [x] Create subscription form exists and works
- [x] Edit subscription form exists
- [x] Pause/Resume toggle in dropdown menu
- [x] Delete with confirmation dialog
- [x] Filter by type and status
- [x] Search by name/URL

### Ingested Items
- [x] List view with cards
- [x] Filter by subscription, status, source type
- [x] Filter by date range
- [x] Sort by date, title
- [x] Pagination implemented
- [x] Export CSV functionality

### Manual Ingestion
- [x] URL input with validation
- [x] Optional subscription linking
- [x] Job tracker component
- [x] Recent jobs history

### Settings
- [x] Settings page displays system info
- [x] Test Connections button
- [x] Trigger Check Now button
- [x] Version info displayed

### UI/UX
- [x] Navigation between pages
- [x] Dark mode toggle (via ThemeProvider)
- [x] Responsive design with Tailwind
- [x] Loading skeletons
- [x] Error states with retry
- [x] Toast notifications (Sonner)

## Test Environment
- Dev server: http://localhost:5173
- Backend API: http://localhost:8950
- Vite version: 7.3.1
- React version: 19.2.3
