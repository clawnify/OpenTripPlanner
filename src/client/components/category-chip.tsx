import { categoryChipStyle } from "@/lib/utils";
import { categoryIcon } from "@/lib/icons";

/** A category chip — a fact, not a status: tinted to the category's own color,
 *  with its lucide icon. Renders nothing when there's no category. */
export function CategoryChip({
  name,
  color,
  icon,
  className,
}: {
  name: string | null | undefined;
  color: string | null | undefined;
  icon?: string | null;
  className?: string;
}) {
  if (!name) return null;
  const Icon = categoryIcon(icon);
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-sm px-2 py-0.5 text-[11px] font-medium ${className ?? ""}`}
      style={categoryChipStyle(color)}
    >
      <Icon className="h-3 w-3" />
      {name}
    </span>
  );
}
