import { DynamicIcon } from "../components/DynamicIcon";

export default function PickerScreen({ active }: { active: boolean }) {
  return <DynamicIcon name={active ? "mdi:check" : "mdi:close"} />;
}
