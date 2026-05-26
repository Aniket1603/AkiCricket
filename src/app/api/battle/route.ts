import { NextResponse } from "next/server";
import { simulateBattleRound } from "@/lib/gemini";

export async function POST(request: Request) {
  try {
    const { category, history } = await request.json();

    if (!category) {
      return NextResponse.json(
        { error: "Category parameter is required." },
        { status: 400 }
      );
    }

    const formattedHistory = Array.isArray(history) ? history : [];
    const battleRound = await simulateBattleRound(category, formattedHistory);

    return NextResponse.json(battleRound);
  } catch (error: any) {
    console.error("Error in /api/battle route handler:", error);
    return NextResponse.json(
      { error: "Internal server error: " + error.message },
      { status: 500 }
    );
  }
}
