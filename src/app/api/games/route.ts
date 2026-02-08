import { NextRequest, NextResponse } from "next/server";
import {
  getPopularRecentGames,
  getTopRatedGames,
  getGamesByGenre,
  getFilteredGames,
  getRandomCuratedGames,
} from "@/lib/supabase-games";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const section = searchParams.get("section") || "popular";
  const genreId = searchParams.get("genreId");
  const genres = searchParams.get("genres");
  const platforms = searchParams.get("platforms");
  const limit = Number(searchParams.get("limit")) || 20;

  try {
    let games;
    switch (section) {
      case "top-rated":
        games = await getTopRatedGames(limit);
        break;
      case "genre":
        if (!genreId) {
          return NextResponse.json(
            { error: "genreId 파라미터가 필요합니다." },
            { status: 400 }
          );
        }
        games = await getGamesByGenre(Number(genreId), limit);
        break;
      case "filter": {
        const genreIds = genres ? genres.split(",").map(Number) : [];
        const platformIds = platforms ? platforms.split(",").map(Number) : [];
        games = await getFilteredGames(genreIds, platformIds, limit);
        break;
      }
      case "random":
        games = await getRandomCuratedGames(limit);
        break;
      case "popular":
      default:
        games = await getPopularRecentGames(limit);
        break;
    }

    return NextResponse.json({ games });
  } catch (error) {
    console.error("Failed to fetch games:", error);
    return NextResponse.json(
      { error: "게임 데이터를 가져올 수 없습니다." },
      { status: 500 }
    );
  }
}
