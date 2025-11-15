declare module 'react-native' {
  export type StyleProp<T> = T | T[] | null | undefined;

  export type TransformValue =
    | { scaleX: number }
    | { scaleY: number }
    | { rotate: string };

  export interface ViewStyle {
    transform?: TransformValue[];
  }
}

