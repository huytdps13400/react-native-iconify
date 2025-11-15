# @react-native-iconify/api

Iconify API integration with redundancy support for React Native.

## Features

- ✅ Fetch icons from Iconify API
- ✅ Multi-host redundancy (automatic failover)
- ✅ Retry logic with exponential backoff
- ✅ TypeScript support
- ✅ 100% test coverage
- ✅ Timeout handling
- ✅ Batch loading support

## Installation

```bash
npm install @react-native-iconify/api
# or
yarn add @react-native-iconify/api
```

## Usage

### Load a single icon

```typescript
import { loadIcon } from '@react-native-iconify/api';

const icon = await loadIcon('mdi:home');

console.log(icon);
// {
//   name: 'mdi:home',
//   body: '<path d="..." />',
//   width: 24,
//   height: 24
// }
```

### Load multiple icons

```typescript
import { loadIcons } from '@react-native-iconify/api';

const icons = await loadIcons(['mdi:home', 'mdi:settings', 'fa:user']);

console.log(icons.length); // 3
```

### Custom fetch options

```typescript
import { fetchIconData } from '@react-native-iconify/api';

const data = await fetchIconData('mdi:home', {
  timeout: 3000,
  maxRetries: 5,
  hosts: ['https://custom-api.com']
});
```

### Generate cache key

```typescript
import { getCacheKey } from '@react-native-iconify/api';

const key = getCacheKey('mdi:home');
console.log(key); // "icon:mdi:home:1"
```

## API

### `loadIcon(iconName: string): Promise<IconData>`

Load a single icon from Iconify API.

**Parameters:**
- `iconName` - Full icon name (e.g., "mdi:home")

**Returns:** Promise that resolves to icon data

### `loadIcons(iconNames: string[]): Promise<IconData[]>`

Load multiple icons from Iconify API (batched by prefix).

**Parameters:**
- `iconNames` - Array of icon names

**Returns:** Promise that resolves to array of icon data

### `fetchIconData(iconName: string, options?: FetchOptions): Promise<IconifyAPIResponse>`

Fetch raw icon data from Iconify API with redundancy.

**Parameters:**
- `iconName` - Full icon name
- `options` - Optional fetch configuration

**Options:**
- `timeout` - Request timeout in ms (default: 5000)
- `maxRetries` - Max retry attempts (default: 3)
- `signal` - AbortSignal for cancellation
- `hosts` - Custom API hosts

### `getCacheKey(iconName: string): string`

Generate consistent cache key for an icon.

**Parameters:**
- `iconName` - Full icon name

**Returns:** Cache key string

### `parseIconData(raw: unknown, iconName?: string): IconData`

Parse and validate raw icon data.

**Parameters:**
- `raw` - Raw icon data object
- `iconName` - Icon name for error messages

**Returns:** Validated IconData

## Types

```typescript
interface IconData {
  name: string;
  body: string;
  width: number;
  height: number;
  left?: number;
  top?: number;
  rotate?: number;
  hFlip?: boolean;
  vFlip?: boolean;
}

interface FetchOptions {
  timeout?: number;
  maxRetries?: number;
  signal?: AbortSignal;
  hosts?: string[];
}
```

## Error Handling

All errors are instances of `IconifyAPIError`:

```typescript
try {
  const icon = await loadIcon('invalid:icon');
} catch (error) {
  if (error instanceof IconifyAPIError) {
    console.log(error.code); // 'NOT_FOUND' | 'NETWORK_ERROR' | 'TIMEOUT' | 'PARSE_ERROR'
    console.log(error.message); // Error message
    console.log(error.details); // Additional error details
  }
}
```

## Development

```bash
# Install dependencies
yarn install

# Run tests
yarn test

# Run tests with coverage
yarn test:coverage

# Build
yarn build

# Lint
yarn lint
```

## License

MIT
