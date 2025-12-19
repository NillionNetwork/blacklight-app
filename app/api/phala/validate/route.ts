import { NextRequest, NextResponse } from "next/server";
import { validatePhalaEndpoints } from "@/lib/phala-validation";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { cvmUrl } = body;

    if (!cvmUrl) {
      return NextResponse.json(
        { error: "CVM URL is required" },
        { status: 400 }
      );
    }

    const validation = await validatePhalaEndpoints(cvmUrl);
    return NextResponse.json(validation);
  } catch (error) {
    console.error("Validation error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

