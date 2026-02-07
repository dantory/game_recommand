import { NextRequest, NextResponse } from "next/server";
import { searchSteamGames } from "@/lib/steam";
import { shuffleArray } from "@/lib/utils";
import { RESULTS_PER_PAGE } from "@/lib/constants";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const tags = searchParams.get("tags") || undefined;

  try {
    const data = await searchSteamGames({ tags, count: 50 });
    const shuffled = shuffleArray(data.games);

    return NextResponse.json({
      games: shuffled.slice(0, RESULTS_PER_PAGE),
      totalCount: data.totalCount,
    });
  } catch (error) {
    console.error("Failed to fetch games:", error);
    return NextResponse.json(
      { error: "게임 데이터를 가져올 수 없습니다." },
      { status: 500 }
    );
  }
}
