import { IconifyIcon } from "@huymobile/react-native-iconify";

export function DynamicIcon({ name }: { name: string }) {
  return <IconifyIcon name={name} size={24} />;
}
