import type { ComponentType } from 'react';

declare module 'react-native-svg' {
  export interface SvgProps {
    width?: number | string;
    height?: number | string;
    color?: string;
    strokeWidth?: number;
    accessibilityLabel?: string;
    accessibilityRole?: string;
    style?: unknown;
  }

  export const SvgXml: ComponentType<SvgProps & { xml: string }>;
}

