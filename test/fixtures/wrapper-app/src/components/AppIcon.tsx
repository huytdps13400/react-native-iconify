// Wrapper reported in https://github.com/huytdps13400/react-native-iconify/issues/7
import { IconifyIcon } from "@huymobile/react-native-iconify";
import type { StyleProp, TextStyle, ViewStyle } from "react-native";

export interface AppIconProps {
  name: string;
  size?: number;
  color?: string;
  style?: StyleProp<TextStyle>;
  [key: string]: unknown;
}

export default function AppIcon({ name, size = 24, color, style, ...rest }: AppIconProps) {
  if (!name) return null;
  return (
    <IconifyIcon
      name={name}
      size={size}
      color={color}
      style={[
        {
          alignSelf: "center",
          alignItems: "center",
          justifyContent: "center",
        },
        style as StyleProp<ViewStyle>,
      ]}
      {...rest}
    />
  );
}
