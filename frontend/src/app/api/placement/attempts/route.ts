import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:4000";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = searchParams.get("limit") || "10";
    const page = searchParams.get("page") || "1";

    const cookieStore = await cookies();
    const cookieEntries: string[] = [];
    cookieStore.getAll().forEach((cookie) => {
      cookieEntries.push(`${cookie.name}=${cookie.value}`);
    });
    const cookieHeader = cookieEntries.join("; ");

    const response = await fetch(
      `${API_BASE}/api/placement/attempts?limit=${limit}&page=${page}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          ...(cookieHeader ? { Cookie: cookieHeader } : {}),
        },
        cache: "no-store",
      }
    );

    if (!response.ok) {
      return NextResponse.json(
        { message: "Failed to fetch attempts" },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("[placement/attempts] Error:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}


