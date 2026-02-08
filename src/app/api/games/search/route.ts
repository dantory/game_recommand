import { NextRequest, NextResponse } from "next/server";
import { searchGames } from "@/lib/supabase-games";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const query = searchParams.get("q");
  const limit = Math.min(Math.max(Number(searchParams.get("limit")) || 20, 1), 50);

  if (!query || query.trim().length === 0) {
    return NextResponse.json(
      { error: "검색어가 필요합니다." },
      { status: 400 }
    );
  }

  try {
    const games = await searchGames(query.trim(), limit);
    return NextResponse.json({ games });
  } catch (error) {
    console.error("Failed to search games:", error);
    return NextResponse.json(
      { error: "게임 검색에 실패했습니다." },
      { status: 500 }
    );
  }
}
