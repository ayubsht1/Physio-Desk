import { NextResponse } from "next/server";
import { getStore } from "@/lib/server-db";

export async function GET(request: Request) {
  const store = getStore();
  const authHeader = request.headers.get("authorization") || "";

  // Check if token corresponds to a user ID
  let user = store.users[0]; // default admin
  const tokenMatch = authHeader.match(/token_(\d+)_/);
  if (tokenMatch) {
    const userId = Number(tokenMatch[1]);
    const found = store.users.find((u) => u.id === userId);
    if (found) user = found;
  } else if (authHeader.includes("staff")) {
    user = store.users.find((u) => u.role === "staff") ?? store.users[0];
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { password_hash, ...userProfile } = user;
  return NextResponse.json(userProfile);
}
