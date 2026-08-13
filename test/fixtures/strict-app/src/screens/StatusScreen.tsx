import { IconifyIcon } from "@huymobile/react-native-iconify";

export default function StatusScreen({ ok }: { ok: boolean }) {
  return <IconifyIcon name={ok ? "mdi:check" : "mdi:close"} size={24} />;
}
