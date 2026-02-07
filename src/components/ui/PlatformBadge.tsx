import { cn } from "@/lib/utils";

interface PlatformBadgeProps {
  platforms: { id: number; name: string }[];
  maxCount?: number;
}

export function PlatformBadge({ platforms, maxCount }: PlatformBadgeProps) {
  if (!platforms || platforms.length === 0) return null;

  // Map platform names to simpler display
  const displayPlatforms = platforms.map(p => {
    const name = p.name;
    if (name.includes("PC")) return { label: "PC", color: "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300" };
    if (name.includes("PlayStation")) return { label: "PS", color: "bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-300" };
    if (name.includes("Xbox")) return { label: "Xbox", color: "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300" };
    if (name.includes("Switch")) return { label: "Switch", color: "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300" };
    if (name.includes("Android")) return { label: "Android", color: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300" };
    if (name.includes("iOS")) return { label: "iOS", color: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300" };
    return null;
  }).filter((p): p is { label: string; color: string } => p !== null);

  // Deduplicate based on label
  const uniquePlatforms = Array.from(new Map(displayPlatforms.map(item => [item.label, item])).values());

  if (uniquePlatforms.length === 0) return null;

  const visiblePlatforms = maxCount ? uniquePlatforms.slice(0, maxCount) : uniquePlatforms;
  const remaining = uniquePlatforms.length - visiblePlatforms.length;

  return (
    <div className="flex flex-wrap gap-1.5">
      {visiblePlatforms.map((platform) => (
        <span
          key={platform.label}
          className={cn(
            "rounded-md px-2 py-0.5 text-[10px] font-medium",
            platform.color
          )}
        >
          {platform.label}
        </span>
      ))}
      {remaining > 0 && (
        <span className="rounded-md bg-gray-100 px-2 py-0.5 text-[10px] font-medium text-gray-500 dark:bg-gray-800 dark:text-gray-400">
          +{remaining}
        </span>
      )}
    </div>
  );
}
