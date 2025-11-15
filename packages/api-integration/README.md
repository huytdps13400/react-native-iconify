# @react-native-iconify/api-integration

React Native component for dynamic Iconify icon loading with automatic caching.

## Features

- ✅ Dynamic icon loading from Iconify API
- ✅ Automatic caching (memory + disk via TurboCache)
- ✅ Offline support (uses cached icons)
- ✅ Loading and error states
- ✅ Customizable styling (size, color, rotate, flip)
- ✅ TypeScript support
- ✅ Callbacks (onLoad, onError)
- ✅ Fallback UI support

## Requirements

**IMPORTANT**: This package requires native modules and does **NOT** support Expo Go.

Supported environments:
- ✅ Expo Development Build (`npx expo prebuild && npx expo run:ios/android`)
- ✅ Bare React Native CLI projects
- ❌ Expo Go (not supported)

For Expo Go compatibility, use [@react-native-iconify/native](https://www.npmjs.com/package/@react-native-iconify/native) with static bundling instead.

## Installation

```bash
npm install @react-native-iconify/api-integration
# or
yarn add @react-native-iconify/api-integration
```

**Peer Dependencies:**
- `react` >= 16.8.0
- `react-native` >= 0.60.0
- `react-native-svg` >= 12.0.0

**Dependencies:**
- `@react-native-iconify/api` - API integration layer
- `@react-native-iconify/turbo-cache` - Native caching layer

## Usage

### Basic Usage

```tsx
import { IconifyIcon } from '@react-native-iconify/api-integration';

function MyComponent() {
  return (
    <IconifyIcon
      name="mdi:home"
      size={24}
      color="blue"
    />
  );
}
```

### With All Props

```tsx
<IconifyIcon
  name="mdi:settings"
  size={32}
  color="#FF5722"
  rotate={90}
  flip="horizontal"
  style={{ margin: 10 }}
  onLoad={() => console.log('Icon loaded!')}
  onError={(error) => console.error('Failed:', error)}
  fallback={<Text>Loading...</Text>}
  testID="settings-icon"
/>
```

### Icon Collections

IconifyIcon supports **150,000+ icons** from various collections:

```tsx
<IconifyIcon name="mdi:home" />          // Material Design Icons
<IconifyIcon name="lucide:settings" />   // Lucide
<IconifyIcon name="heroicons:user" />    // Heroicons
<IconifyIcon name="fa:heart" />          // Font Awesome
<IconifyIcon name="ri:github-fill" />    // Remix Icon
```

Search for icons at: https://icon-sets.iconify.design/

## API

### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `name` | `string` | **required** | Icon name in format "collection:icon" |
| `size` | `number` | `24` | Icon size in pixels |
| `color` | `string` | `"currentColor"` | Icon color (any valid color) |
| `rotate` | `number` | `0` | Rotation in degrees (0-360) |
| `flip` | `"horizontal"` \| `"vertical"` \| `"both"` | `undefined` | Flip direction |
| `style` | `StyleProp<ViewStyle>` | `undefined` | Additional container styles |
| `onLoad` | `() => void` | `undefined` | Callback when icon loads successfully |
| `onError` | `(error: Error) => void` | `undefined` | Callback when icon fails to load |
| `fallback` | `ReactNode` | `undefined` | Custom fallback UI during loading/error |
| `testID` | `string` | `undefined` | Test identifier for testing |

### Types

```typescript
export interface IconifyIconProps {
  name: string;
  size?: number;
  color?: string;
  rotate?: number;
  flip?: IconFlip;
  style?: StyleProp<ViewStyle>;
  onLoad?: () => void;
  onError?: (error: Error) => void;
  fallback?: ReactNode;
  testID?: string;
}

export type IconFlip = 'horizontal' | 'vertical' | 'both';
```

## Features in Detail

### Automatic Caching

Icons are automatically cached after first load:

```
First load:  API fetch → Cache → Render  (~500ms)
Subsequent:  Cache hit → Render           (<10ms)
```

The component uses a two-layer cache:
1. **Memory Cache** (LRU, 1000 icons max) - Very fast
2. **Disk Cache** (Native, persistent) - Survives app restarts

### Loading States

**Default loading indicator:**
```tsx
<IconifyIcon name="mdi:home" />
// Shows ActivityIndicator while loading
```

**Custom loading UI:**
```tsx
<IconifyIcon
  name="mdi:home"
  fallback={<Text>Loading icon...</Text>}
/>
```

### Error Handling

**Default error state:**
```tsx
<IconifyIcon name="mdi:home" />
// Shows empty View on error
```

**Custom error UI:**
```tsx
<IconifyIcon
  name="mdi:home"
  fallback={<Text>❌ Failed</Text>}
  onError={(error) => console.error(error)}
/>
```

### Transformations

**Rotation:**
```tsx
<IconifyIcon name="mdi:arrow-up" rotate={90} />  // Points right
<IconifyIcon name="mdi:arrow-up" rotate={180} /> // Points down
```

**Flip:**
```tsx
<IconifyIcon name="mdi:chevron-right" flip="horizontal" />
<IconifyIcon name="mdi:chevron-down" flip="vertical" />
<IconifyIcon name="mdi:arrow-up" flip="both" />
```

**Combined:**
```tsx
<IconifyIcon
  name="mdi:arrow-up"
  rotate={45}
  flip="horizontal"
/>
```

### Offline Support

Icons work offline if they've been cached:

```tsx
// First time online:  Downloads and caches
// Later offline:      Loads from disk cache
<IconifyIcon name="mdi:home" />
```

### Styling

**Size and color:**
```tsx
<IconifyIcon name="mdi:home" size={48} color="#FF5722" />
```

**Container styling:**
```tsx
<IconifyIcon
  name="mdi:home"
  style={{
    margin: 10,
    padding: 5,
    backgroundColor: '#f0f0f0',
    borderRadius: 4
  }}
/>
```

## Examples

### Icon List

```tsx
function IconList() {
  const icons = ['mdi:home', 'mdi:settings', 'mdi:user', 'mdi:heart'];

  return (
    <View style={{ flexDirection: 'row' }}>
      {icons.map(name => (
        <IconifyIcon key={name} name={name} size={32} color="blue" />
      ))}
    </View>
  );
}
```

### Dynamic Icon Switching

```tsx
function DynamicIcon() {
  const [iconName, setIconName] = useState('mdi:home');

  return (
    <>
      <IconifyIcon name={iconName} size={48} />
      <Button
        title="Switch"
        onPress={() => setIconName('mdi:settings')}
      />
    </>
  );
}
```

### With Animation

```tsx
import Animated from 'react-native-reanimated';

function AnimatedIcon() {
  const rotation = useSharedValue(0);

  useEffect(() => {
    rotation.value = withRepeat(
      withTiming(360, { duration: 2000 }),
      -1
    );
  }, []);

  return (
    <Animated.View style={{ transform: [{ rotate: `${rotation.value}deg` }] }}>
      <IconifyIcon name="mdi:loading" size={48} />
    </Animated.View>
  );
}
```

### Preloading Icons

```tsx
import { createCache } from '@react-native-iconify/turbo-cache';
import { fetchIconData } from '@react-native-iconify/api';

async function preloadIcons() {
  const cache = createCache();
  const icons = ['mdi:home', 'mdi:settings', 'mdi:user'];

  for (const name of icons) {
    const data = await fetchIconData(name);
    await cache.set(`icon:${name}`, data.body);
  }
}
```

## Performance

| Operation | Time | Notes |
|-----------|------|-------|
| Cache hit (memory) | < 1ms | Very fast |
| Cache hit (disk) | < 10ms | Fast, persistent |
| API fetch | < 500ms | First load only |
| Component render | < 50ms | After data loaded |

### Optimization Tips

1. **Preload critical icons** at app startup
2. **Use consistent icon sizes** for better caching
3. **Avoid frequent icon switching** in animations
4. **Cache warming** for offline scenarios

## Architecture

```
IconifyIcon Component
        ↓
fetchIconData() [API]
        ↓
createCache() [TurboCache]
        ↓
Memory Cache → Disk Cache (Native)
        ↓
iOS: SDWebImage | Android: Glide
```

## Testing

```tsx
import { render, waitFor } from '@testing-library/react-native';
import { IconifyIcon } from '@react-native-iconify/api-integration';

test('renders icon after load', async () => {
  const { getByTestID } = render(
    <IconifyIcon name="mdi:home" testID="icon" />
  );

  await waitFor(() => {
    expect(getByTestID('icon')).toBeDefined();
  });
});
```

## Troubleshooting

### Icon not loading

**Check icon name format:**
```tsx
// ✅ Correct
<IconifyIcon name="mdi:home" />

// ❌ Wrong
<IconifyIcon name="home" />
<IconifyIcon name="mdi-home" />
```

**Check network connectivity:**
```tsx
<IconifyIcon
  name="mdi:home"
  onError={(e) => console.log('Network error:', e)}
/>
```

### Performance issues

**Reduce memory cache size:**
```tsx
import { createCache } from '@react-native-iconify/turbo-cache';

const cache = createCache({ maxSize: 500 }); // Default: 1000
```

**Clear cache:**
```tsx
const cache = createCache();
await cache.clear();
```

## License

MIT

## Related Packages

- [`@react-native-iconify/api`](../api) - Iconify API integration
- [`@react-native-iconify/turbo-cache`](../turbo-cache) - Native caching layer
