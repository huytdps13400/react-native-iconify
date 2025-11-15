/**
 * Type definitions for @react-native-iconify/api-integration
 */

import type { StyleProp, ViewStyle } from 'react-native';
import type { ReactNode } from 'react';
import type { IconData } from '@react-native-iconify/api';

/**
 * Icon flip direction
 */
export type IconFlip = 'horizontal' | 'vertical' | 'both';

/**
 * Props for IconifyIcon component
 */
export interface IconifyIconProps {
  /**
   * Icon name in format "collection:icon"
   * Example: "mdi:home", "lucide:settings"
   */
  name: string;

  /**
   * Icon size in pixels
   * @default 24
   */
  size?: number;

  /**
   * Icon color
   * @default "currentColor"
   */
  color?: string;

  /**
   * Rotation in degrees (0-360)
   * @default 0
   */
  rotate?: number;

  /**
   * Flip direction
   */
  flip?: IconFlip;

  /**
   * Additional styles for the container
   */
  style?: StyleProp<ViewStyle>;

  /**
   * Callback when icon is loaded successfully
   */
  onLoad?: () => void;

  /**
   * Callback when icon fails to load
   */
  onError?: (error: Error) => void;

  /**
   * Fallback UI while loading or on error
   */
  fallback?: ReactNode;

  /**
   * Test ID for testing
   */
  testID?: string;
}

/**
 * Internal icon state
 */
export interface IconState {
  loading: boolean;
  error: Error | null;
  iconData: IconData | null;
}
