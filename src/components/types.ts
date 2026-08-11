import type { StyleProp, ViewStyle } from 'react-native';
import type { ReactNode } from 'react';
import type { IconData } from '../api/types';

export interface IconifyIconProps {
  /** Icon name in format: "prefix:icon-name" (e.g., "mdi:home") */
  name: string;

  /** Icon size in pixels */
  size?: number;

  /** Icon color */
  color?: string;

  /** Custom style for the container View */
  style?: StyleProp<ViewStyle>;

  /** Callback when icon loads successfully */
  onLoad?: (iconData: IconData) => void;

  /** Callback when icon fails to load */
  onError?: (error: Error) => void;

  /** Fallback rendered while loading or after an error */
  fallback?: ReactNode;

  /** Test identifier forwarded to the container */
  testID?: string;

  /** Flip the icon horizontally, vertically, or both */
  flip?: 'horizontal' | 'vertical' | 'both';

  /** Horizontal flip */
  hFlip?: boolean;

  /** Vertical flip */
  vFlip?: boolean;

  /** Rotation in degrees (0, 90, 180, 270) */
  rotate?: 0 | 90 | 180 | 270 | 1 | 2 | 3;
}

export interface IconState {
  loading: boolean;
  error: Error | null;
  svgXml: string | null;
}
