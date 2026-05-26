import { NextResponse } from "next/server";
import { explainGuess } from "@/lib/gemini";

export async function POST(request: Request) {
  try {
    const { target, category, history } = await request.json();

    if (!target || !category) {
      return NextResponse.json(
        { error: "Target and Category parameters are required." },
        { status: 400 }
      );
    }

    const formattedHistory = Array.isArray(history) ? history : [];
    const explanation = await explainGuess(target, category, formattedHistory);

    return NextResponse.json(explanation);
  } catch (error: any) {
    console.error("Error in /api/explain route handler:", error);
    return NextResponse.json(
      { error: "Internal server error: " + error.message },
      { status: 500 }
    );
  }
}
