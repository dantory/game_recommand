import { cn } from "@/lib/utils";
import type { RawgPlatform } from "@/types/game";

interface PlatformBadgeProps {
  platforms: RawgPlatform[];
}

const MOBILE_PLATFORMS: Record<string, { label: string; color: string }> = {
  ios: { label: "iOS", color: "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300" },
  android: { label: "Android", color: "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300" },
};

export function PlatformBadge({ platforms }: PlatformBadgeProps) {
  const mobilePlatforms = platforms
    .map((p) => MOBILE_PLATFORMS[p.platform.slug])
    .filter(Boolean);

  if (mobilePlatforms.length === 0) return null;

  return (
    <div className="flex gap-1.5">
      {mobilePlatforms.map((p) => (
        <span
          key={p.label}
          className={cn(
            "rounded-md px-2 py-0.5 text-xs font-medium",
            p.color
          )}
        >
          {p.label}
        </span>
      ))}
    </div>
  );
}
