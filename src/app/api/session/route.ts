import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { apiErrorResponse } from "@/lib/api";

export async function GET() {
  try {
  const user = await getSession();
  if (!user) {
    return NextResponse.json({ message: "Not authenticated" }, { status: 401 });
  }
  return NextResponse.json({ user });
  } catch (error) {
    return apiErrorResponse(error, "Failed to load your session");
  }
}

