import { IconifyIcon } from "@huymobile/react-native-iconify";

export default function CallbackScreen() {
  return (
    <IconifyIcon
      onError={(error) => console.warn(error)}
      name="mdi:refresh"
      size={24}
    />
  );
}
