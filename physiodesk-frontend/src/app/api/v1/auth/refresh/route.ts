import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json({
    access_token: `token_refreshed_${Date.now()}`,
    refresh_token: `refresh_refreshed_${Date.now()}`,
    token_type: "bearer",
  });
}
