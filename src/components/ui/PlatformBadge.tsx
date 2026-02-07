import { cn } from "@/lib/utils";
import type { SteamPlatform } from "@/types/game";

interface PlatformBadgeProps {
  platforms: SteamPlatform[];
}

const PLATFORM_STYLES: Record<string, { label: string; color: string }> = {
  windows: {
    label: "Windows",
    color: "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300",
  },
  mac: {
    label: "macOS",
    color: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
  },
  linux: {
    label: "Linux",
    color: "bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300",
  },
};

export function PlatformBadge({ platforms }: PlatformBadgeProps) {
  const supportedPlatforms = platforms
    .map((platform) => PLATFORM_STYLES[platform.slug])
    .filter(Boolean);

  if (supportedPlatforms.length === 0) return null;

  return (
    <div className="flex gap-1.5">
      {supportedPlatforms.map((platform) => (
        <span
          key={platform.label}
          className={cn(
            "rounded-md px-2 py-0.5 text-xs font-medium",
            platform.color
          )}
        >
          {platform.label}
        </span>
      ))}
    </div>
  );
}
