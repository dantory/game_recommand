import { NextRequest, NextResponse } from "next/server";
import { getRecommendations } from "@/lib/recommend";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const gameIdStr = searchParams.get("gameId");
  const limitStr = searchParams.get("limit");

  if (!gameIdStr) {
    return NextResponse.json(
      { error: "gameId 파라미터가 필요합니다." },
      { status: 400 }
    );
  }

  const gameId = parseInt(gameIdStr, 10);
  if (isNaN(gameId)) {
    return NextResponse.json(
      { error: "gameId는 유효한 숫자여야 합니다." },
      { status: 400 }
    );
  }

  const limit = Math.min(Math.max(parseInt(limitStr ?? "10", 10) || 10, 1), 50);

  try {
    const games = await getRecommendations(gameId, limit);
    return NextResponse.json({ games });
  } catch (error) {
    console.error("Failed to get recommendations:", error);
    return NextResponse.json(
      { error: "추천 게임을 불러오는데 실패했습니다." },
      { status: 500 }
    );
  }
}
