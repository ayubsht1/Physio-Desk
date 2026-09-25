import { NextResponse } from "next/server";
import { getStore } from "@/lib/server-db";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { username, password } = body;
    const store = getStore();

    const user = store.users.find(
      (u) =>
        u.username.toLowerCase() === (username || "").toLowerCase() ||
        u.email.toLowerCase() === (username || "").toLowerCase()
    );

    if (!user || user.password_hash !== password) {
      return NextResponse.json(
        { detail: "Incorrect username or password" },
        { status: 401 }
      );
    }

    return NextResponse.json({
      access_token: `token_${user.id}_${Date.now()}`,
      refresh_token: `refresh_${user.id}_${Date.now()}`,
      token_type: "bearer",
    });
  } catch (error) {
    return NextResponse.json(
      { detail: error instanceof Error ? error.message : "Invalid request" },
      { status: 400 }
    );
  }
}
