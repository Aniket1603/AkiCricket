import { NextResponse } from "next/server";
import { askGeminiToGuess } from "@/lib/gemini";

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
    const guessResponse = await askGeminiToGuess(category, formattedHistory);

    return NextResponse.json(guessResponse);
  } catch (error: any) {
    console.error("Error in /api/guess route handler:", error);
    return NextResponse.json(
      { error: "Internal server error: " + error.message },
      { status: 500 }
    );
  }
}
