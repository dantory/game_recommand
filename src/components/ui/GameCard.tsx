import Image from "next/image";
import { PlatformBadge } from "./PlatformBadge";
import type { RawgGame } from "@/types/game";

interface GameCardProps {
  game: RawgGame;
}

export function GameCard({ game }: GameCardProps) {
  return (
    <a
      href={`https://rawg.io/games/${game.slug}`}
      target="_blank"
      rel="noopener noreferrer"
      className="group overflow-hidden rounded-2xl border border-border transition-transform hover:scale-[1.02]"
    >
      <div className="relative aspect-video bg-muted">
        {game.background_image ? (
          <Image
            src={game.background_image}
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
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <span>&#9733;</span>
            <span>{game.rating.toFixed(1)}</span>
          </span>
          <span>|</span>
          <span className="line-clamp-1">
            {game.genres.map((g) => g.name).join(", ")}
          </span>
        </div>
        <PlatformBadge platforms={game.platforms} />
      </div>
    </a>
  );
}
