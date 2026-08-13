import { View } from "react-native";
import { IconifyIcon } from "@huymobile/react-native-iconify";

export default function DirectScreen() {
  return (
    <View>
      <IconifyIcon name="mdi:home" size={24} />
      <IconifyIcon name={"mdi:account"} size={24} />
      <IconifyIcon name={`mdi:bell`} size={24} />
    </View>
  );
}
