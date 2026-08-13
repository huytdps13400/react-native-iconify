// Wrapper of a wrapper: CardIcon -> AppIcon -> IconifyIcon
import AppIcon from "./AppIcon";

export function CardIcon({ name }: { name: string }) {
  return <AppIcon name={name} size={16} />;
}
