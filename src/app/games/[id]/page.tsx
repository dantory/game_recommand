import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getGameDetail } from "@/lib/igdb";
import { igdbImageUrl, cn } from "@/lib/utils";
import { PlatformBadge } from "@/components/ui/PlatformBadge";
import { GameCard } from "@/components/ui/GameCard";

interface GameDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function GameDetailPage({ params }: GameDetailPageProps) {
  const { id } = await params;
  const gameId = parseInt(id, 10);

  if (isNaN(gameId)) {
    notFound();
  }

  const game = await getGameDetail(gameId);

  if (!game) {
    notFound();
  }

  const releaseDate = game.first_release_date
    ? new Date(game.first_release_date * 1000).toLocaleDateString("ko-KR")
    : "출시일 미정";

  const rating = game.rating ? Math.round(game.rating) : null;

  return (
    <div className="min-h-dvh bg-background pb-20">
      {/* Hero Section with Backdrop */}
      <div className="relative h-[40vh] w-full md:h-[50vh]">
        {game.screenshots && game.screenshots.length > 0 ? (
          <Image
            src={igdbImageUrl(game.screenshots[0].url, "t_1080p")}
            alt={game.name}
            fill
            className="object-cover opacity-30 blur-sm"
            priority
          />
        ) : (
          <div className="h-full w-full bg-muted opacity-30" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-transparent" />
        
        <div className="absolute bottom-0 left-0 right-0 mx-auto max-w-6xl px-4 pb-8">
          <Link
            href="/"
            className="mb-6 inline-flex items-center text-sm font-medium text-muted-foreground hover:text-foreground"
          >
            ← 돌아가기
          </Link>
          <div className="flex flex-col gap-6 md:flex-row md:items-end">
            <div className="relative aspect-[3/4] w-32 shrink-0 overflow-hidden rounded-xl border border-border shadow-2xl md:w-48">
              {game.cover?.url ? (
                <Image
                  src={igdbImageUrl(game.cover.url, "t_720p")}
                  alt={game.name}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 128px, 192px"
                  priority
                />
              ) : (
                <div className="flex h-full items-center justify-center bg-muted text-muted-foreground">
                  No Image
                </div>
              )}
            </div>
            <div className="space-y-2">
              <h1 className="text-3xl font-bold md:text-5xl">{game.name}</h1>
              <div className="flex flex-wrap items-center gap-4 text-sm">
                <span
                  className={cn(
                    "rounded-md px-2 py-0.5 font-bold",
                    rating !== null && rating >= 80 && "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300",
                    rating !== null && rating >= 60 && rating < 80 && "bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300",
                    rating !== null && rating < 60 && "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300",
                    rating === null && "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300"
                  )}
                >
                  {rating !== null ? `${rating}점` : "평가 없음"}
                </span>
                <span className="text-muted-foreground">{releaseDate}</span>
                <PlatformBadge platforms={game.platforms || []} />
              </div>
              {game.genres && (
                <div className="flex flex-wrap gap-2">
                  {game.genres.map((genre) => (
                    <span
                      key={genre.id}
                      className="rounded-full border border-border bg-background px-3 py-1 text-xs font-medium"
                    >
                      {genre.name}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <main className="mx-auto max-w-6xl space-y-12 px-4 py-8">
        {/* Summary */}
        {game.summary && (
          <section className="space-y-4">
            <h2 className="text-xl font-bold">게임 소개</h2>
            <p className="leading-relaxed text-muted-foreground">
              {game.summary}
            </p>
          </section>
        )}

        {/* Screenshots */}
        {game.screenshots && game.screenshots.length > 0 && (
          <section className="space-y-4">
            <h2 className="text-xl font-bold">스크린샷</h2>
            <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
              {game.screenshots.map((shot, idx) => (
                <div
                  key={idx}
                  className="relative aspect-video w-[300px] shrink-0 overflow-hidden rounded-xl border border-border md:w-[400px]"
                >
                  <Image
                    src={igdbImageUrl(shot.url, "t_screenshot_big")}
                    alt={`Screenshot ${idx + 1}`}
                    fill
                    className="object-cover"
                  />
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Videos */}
        {game.videos && game.videos.length > 0 && (
          <section className="space-y-4">
            <h2 className="text-xl font-bold">비디오</h2>
            <div className="grid gap-4 md:grid-cols-2">
              {game.videos.slice(0, 2).map((video) => (
                <div
                  key={video.video_id}
                  className="aspect-video w-full overflow-hidden rounded-xl border border-border bg-black"
                >
                  <iframe
                    src={`https://www.youtube.com/embed/${video.video_id}`}
                    title="YouTube video player"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    className="h-full w-full"
                  />
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Similar Games */}
        {game.similar_games && game.similar_games.length > 0 && (
          <section className="space-y-4">
            <h2 className="text-xl font-bold">비슷한 게임</h2>
            <div className="flex gap-4 overflow-x-auto pb-4 snap-x snap-mandatory scrollbar-hide">
              {game.similar_games.map((similar) => (
                <div
                  key={similar.id}
                  className="min-w-[200px] snap-start sm:min-w-[240px]"
                >
                  <GameCard game={similar} />
                </div>
              ))}
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
