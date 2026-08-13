import { View } from "react-native";
import AppIcon from "../components/AppIcon";

export default function HomeScreen() {
  return (
    <View>
      <AppIcon name="mdi:heart" size={32} />
      <AppIcon name="ion:arrow-back" color="red" />
      <AppIcon name="feather:settings" />
    </View>
  );
}
