# Known Issues & Limitations

## Known Bugs

### P1 - Type Coercion in Subscription Hooks
- **Status**: Fixed in this release
- **Issue**: subscription.id type mismatch in optimistic updates
- **Impact**: Optimistic updates may not match correctly
- **Fix**: Lines 82 and 142 in useSubscriptions.ts

## Current Limitations

### Testing
- ⚠️ No automated tests yet
- ⚠️ Job tracking polling not tested under load
- ✅ TypeScript provides compile-time safety

### Job Tracking
- ℹ️ Polling every 5 seconds may cause network load
- ℹ️ No WebSocket support for real-time updates
- 💡 Future: Implement WebSocket for job updates

### Subscription Management
- ⚠️ No bulk operations (pause/resume multiple)
- ⚠️ No import/export of subscriptions
- 💡 Future: OPML import/export

### Performance
- ℹ️ Large ingestion lists (10,000+) may be slow
- ℹ️ CSV export for large datasets not optimized
- 💡 Future: Implement streaming exports

## Future Enhancements

### High Priority
- [ ] Add automated test suite
- [ ] Implement WebSocket for real-time job updates
- [ ] Add bulk subscription operations
- [ ] Implement OPML import/export

### Medium Priority
- [ ] Add subscription templates
- [ ] Implement notification preferences
- [ ] Add advanced filtering (regex, date ranges)

### Low Priority
- [ ] Add usage analytics dashboard
- [ ] Implement subscription recommendations
- [ ] Add content preview before ingestion

## Browser Support

- ✅ Chrome 90+
- ✅ Firefox 88+
- ✅ Safari 14+
- ✅ Edge 90+
- ❌ IE11 (not supported)
