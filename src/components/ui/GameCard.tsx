import Image from "next/image";
import Link from "next/link";
import { PlatformBadge } from "./PlatformBadge";
import { cn, igdbImageUrl } from "@/lib/utils";
import type { IGDBGame } from "@/types/game";

interface GameCardProps {
  game: IGDBGame;
}

export function GameCard({ game }: GameCardProps) {
  const rating = game.rating ? Math.round(game.rating) : null;
  
  return (
    <Link
      href={`/games/${game.id}`}
      className="group block overflow-hidden rounded-2xl border border-border bg-card transition-transform hover:scale-[1.02]"
    >
      <div className="relative aspect-video bg-muted">
        {game.cover?.url ? (
          <Image
            src={igdbImageUrl(game.cover.url, "t_cover_big")}
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
        <h3 className="line-clamp-1 text-sm font-bold leading-tight">
          {game.name}
        </h3>
        <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          <span
            className={cn(
              "font-medium",
              rating !== null && rating >= 80 && "text-green-600 dark:text-green-400",
              rating !== null && rating >= 60 && rating < 80 && "text-yellow-600 dark:text-yellow-400",
              rating !== null && rating < 60 && "text-red-600 dark:text-red-400"
            )}
          >
            {rating !== null ? `${rating}점` : "평가 없음"}
          </span>
          {game.genres && game.genres.length > 0 && (
            <>
              <span>|</span>
              <span className="line-clamp-1 max-w-[120px]">
                {game.genres.slice(0, 2).map(g => g.name).join(", ")}
              </span>
            </>
          )}
        </div>
        <PlatformBadge platforms={game.platforms || []} />
      </div>
    </Link>
  );
}
