# OpenSpec: Add Iconify API + Native Cache Support for react-native-iconify

## Summary

Enhance `react-native-iconify` to support Iconify API with native disk/memory caching via Turbo module. This enables:
- **Access 200k+ icons** from Iconify API (no static config)
- **Offline-first** with native cache (SDWebImage/Glide inspired)
- **Live icon updates** without rebuild
- **Production-ready** with 100% test coverage
- **Universal CLI support** via Turbo module (Expo + bare RN)

## Problem Statement

Current `react-native-iconify`:
- ❌ Static icon generation at build time
- ❌ No dynamic icon loading
- ❌ Large bundle for icon-heavy apps
- ❌ No offline support after first load
- ❌ Can't update icons without rebuild

Users want:
- ✅ Access entire Iconify ecosystem (200k+ icons)
- ✅ Dynamic icon loading (user customization)
- ✅ Automatic disk caching (offline safe)
- ✅ No API dependency issues (fallback/redundancy)
- ✅ CLI support without Expo

## Solution

Implement **3-layer architecture**:

```
Layer 1: API (Iconify integration)
  ├─ @iconify/fetch (redundancy + failover)
  ├─ @iconify/utils (icon parsing)
  └─ Handles: Icon data, API calls, error recovery

Layer 2: Cache (Native bridge via Turbo module)
  ├─ Disk cache (SDWebImage/Glide equivalent)
  ├─ Memory cache (LRU)
  ├─ Turbo module JSI interface
  └─ Handles: Persistence, performance

Layer 3: Component (React Native integration)
  ├─ <IconifyIcon name="mdi:home" />
  ├─ Props: size, color, rotate, flip
  ├─ Fallback + error handling
  └─ Handles: UI rendering, styling
```

## Architecture Details

### New Packages

```
packages/
├── api/                    # Iconify API integration
│   ├── src/
│   │   ├── index.ts       # Public API
│   │   ├── fetch.ts       # Fetch with redundancy
│   │   ├── loader.ts      # Icon data loading
│   │   └── types.ts       # TypeScript types
│   ├── tests/
│   │   ├── fetch.test.ts  # 100% coverage
│   │   ├── loader.test.ts
│   │   └── integration.test.ts
│   └── package.json
│
├── turbo-cache/            # Native cache bridge
│   ├── src/
│   │   ├── index.ts       # Turbo module wrapper
│   │   ├── native.ts      # JSI interface
│   │   ├── cache.ts       # Memory cache layer
│   │   └── types.ts
│   ├── ios/               # Swift code (minimal)
│   ├── android/           # Kotlin code (minimal)
│   ├── tests/
│   │   ├── cache.test.ts
│   │   ├── native.test.ts # Mock JSI
│   │   └── integration.test.ts
│   └── package.json
│
└── api-integration/        # API + Cache integration
    ├── src/
    │   ├── index.ts       # Public API
    │   ├── IconifyIcon.tsx # Component
    │   ├── hooks.ts       # useIcon hook
    │   └── types.ts
    ├── tests/
    │   ├── component.test.ts
    │   ├── hooks.test.ts
    │   └── e2e.test.ts
    └── package.json
```

### Cache Flow

```
Request icon "mdi:home"
         ↓
Check memory cache
         ↓ (miss)
Check disk cache (Turbo module)
         ↓ (miss)
Fetch from Iconify API
         ↓
Save to disk cache
         ↓
Save to memory cache
         ↓
Render icon
```

### Turbo Module Interface

```typescript
// Native side (JSI bridge)
interface IconCacheModule {
  // Disk operations
  get(key: string): Promise<string | null>;
  set(key: string, data: string): Promise<void>;
  remove(key: string): Promise<void>;
  clear(): Promise<void>;
  
  // Metadata
  getSize(): Promise<number>;
  getExpiry(key: string): Promise<number | null>;
  
  // Batch operations
  mget(keys: string[]): Promise<Record<string, string | null>>;
  mset(items: Record<string, string>): Promise<void>;
}
```

## Changes Required

### 1. New Packages Creation
- `packages/api/` - Iconify API integration
- `packages/turbo-cache/` - Native cache bridge
- `packages/api-integration/` - Component + hooks

### 2. Modified Packages
- `packages/native/` - Add `IconifyIcon` dynamic component
- `packages/metro/` - Support both static + API modes
- `root package.json` - Add new workspace packages

### 3. CLI Enhancement
- Add icon search/preview
- Cache management commands
- API status check

### 4. Documentation
- Architecture guide
- API reference
- Migration guide from static to API
- Performance benchmarks

## Test Strategy

### Unit Tests (100% coverage)
- API fetching + redundancy
- Cache operations (get/set/remove)
- Icon parsing
- Component rendering
- Error handling

### Integration Tests
- API + cache flow
- Offline scenarios
- Cache invalidation
- Error recovery

### E2E Tests
- Full app flow
- CLI commands
- Performance metrics

## Backward Compatibility

✅ **Fully compatible:**
- Static generation still works via `packages/metro`
- New API mode opt-in
- Hybrid mode: critical icons static, others dynamic

## Implementation Timeline

| Phase | Duration | Deliverables |
|-------|----------|--------------|
| Session 1 | Current | OpenSpec + Analysis + Test setup |
| Session 2 | Next | `@react-native-iconify/api` |
| Session 3 | Next | `@react-native-iconify/turbo-cache` |
| Session 4 | Next | API + Cache integration |
| Session 5 | Next | CLI + Complete testing |
| Session 6 | Next | Cleanup + Validation |

## Success Criteria

- ✅ 100% test coverage
- ✅ Offline support verified
- ✅ API redundancy tested
- ✅ Performance benchmarks acceptable
- ✅ CLI works standalone
- ✅ Expo + bare RN support
- ✅ Documentation complete
- ✅ Safe cleanup completed

## Risks & Mitigation

| Risk | Mitigation |
|------|-----------|
| Native cache complexity | Leverage expo-image proven patterns |
| API reliability | Implement redundancy + offline fallback |
| Test coverage gaps | 100% target + continuous validation |
| File cleanup mistakes | Dependency analysis + safety checks |

## Decision Log

- **Cache native:** Use SDWebImage/Glide patterns (proven production)
- **Turbo module:** Native bridge only (simpler, focused)
- **Multi-session:** Better testing + review cycles
- **100% coverage:** Ensure reliability + maintainability


