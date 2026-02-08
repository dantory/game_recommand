import { NextRequest, NextResponse } from "next/server";
import { getGameDetail } from "@/lib/supabase-games";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const gameId = Number(id);

  if (Number.isNaN(gameId)) {
    return NextResponse.json(
      { error: "유효하지 않은 게임 ID입니다." },
      { status: 400 }
    );
  }

  try {
    const game = await getGameDetail(gameId);

    if (!game) {
      return NextResponse.json(
        { error: "게임을 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    return NextResponse.json({ game });
  } catch (error) {
    console.error("Failed to fetch game detail:", error);
    return NextResponse.json(
      { error: "게임 상세 정보를 가져올 수 없습니다." },
      { status: 500 }
    );
  }
}
