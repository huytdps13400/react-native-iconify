import { IconifyIcon } from "@huymobile/react-native-iconify";

export default function TemplateScreen({ kind }: { kind: string }) {
  return <IconifyIcon name={`mdi:${kind}`} size={24} />;
}
