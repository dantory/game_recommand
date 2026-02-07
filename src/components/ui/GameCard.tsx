import Image from "next/image";
import { PlatformBadge } from "./PlatformBadge";
import { cn } from "@/lib/utils";
import type { SteamGame } from "@/types/game";

interface GameCardProps {
  game: SteamGame;
}

export function GameCard({ game }: GameCardProps) {
  const isFree = game.priceFinal === null || game.priceFinal === 0;
  const isDiscounted = (game.discountPercent ?? 0) > 0;
  const formattedFinalPrice =
    game.priceFinal !== null
      ? `₩ ${(game.priceFinal / 100).toLocaleString("ko-KR")}`
      : "무료";
  const formattedOriginalPrice =
    game.priceOriginal !== null
      ? `₩ ${(game.priceOriginal / 100).toLocaleString("ko-KR")}`
      : null;

  return (
    <a
      href={game.url}
      target="_blank"
      rel="noopener noreferrer"
      className="group overflow-hidden rounded-2xl border border-border transition-transform hover:scale-[1.02]"
    >
      <div className="relative aspect-video bg-muted">
        {game.headerImage ? (
          <Image
            src={game.headerImage}
            alt={game.name}
            fill
            className="object-cover"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-muted-foreground">
            No Image
          </div>
        )}
      </div>
      <div className="space-y-2 p-4">
        <h3 className="line-clamp-2 text-sm font-bold leading-tight">
          {game.name}
        </h3>
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
          <span
            className={cn(
              "font-medium",
              game.reviewPercent !== null && game.reviewPercent >= 80 && "text-green-600 dark:text-green-400",
              game.reviewPercent !== null && game.reviewPercent < 60 && "text-red-600 dark:text-red-400"
            )}
          >
            {game.reviewSummary ?? "평가 없음"}
          </span>
          {game.reviewPercent !== null && <span>{game.reviewPercent}%</span>}
          {game.released && (
            <>
              <span>|</span>
              <span>{game.released}</span>
            </>
          )}
        </div>
        <div className="flex items-center gap-2 text-sm">
          {isDiscounted && (
            <span className="rounded-md bg-accent px-1.5 py-0.5 text-xs font-bold text-white">
              -{game.discountPercent}%
            </span>
          )}
          {isDiscounted && formattedOriginalPrice && (
            <span className="text-xs text-muted-foreground line-through">
              {formattedOriginalPrice}
            </span>
          )}
          <span className="font-semibold">
            {isFree ? "무료" : formattedFinalPrice}
          </span>
        </div>
        <PlatformBadge platforms={game.platforms} />
      </div>
    </a>
  );
}
