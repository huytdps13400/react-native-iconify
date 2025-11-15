declare module 'react-native' {
  export type StyleProp<T> = T | T[] | null | undefined;

  export type TransformValue = { scaleX: number } | { scaleY: number } | { rotate: string };

  export interface ViewStyle {
    transform?: TransformValue[];
  }
}

declare module 'react-native-svg' {
  import type { ComponentType } from 'react';

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
