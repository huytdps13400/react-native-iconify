// Only ever used under a different local name, so the forwarded `name` prop must
// still be credited to BadgeIcon rather than reported as unresolvable.
import { IconifyIcon } from "@huymobile/react-native-iconify";

export default function BadgeIcon({ name }: { name: string }) {
  return <IconifyIcon name={name} size={12} />;
}
