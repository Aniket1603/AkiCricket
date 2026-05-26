import { NextResponse } from "next/server";
import { generateTimeline } from "@/lib/gemini";

export async function POST(request: Request) {
  try {
    const { target, category } = await request.json();

    if (!target || !category) {
      return NextResponse.json(
        { error: "Target and Category parameters are required." },
        { status: 400 }
      );
    }

    const timelineData = await generateTimeline(target, category);

    return NextResponse.json(timelineData);
  } catch (error: any) {
    console.error("Error in /api/timeline route: ", error);
    return NextResponse.json(
      { error: "Internal server error: " + error.message },
      { status: 500 }
    );
  }
}
