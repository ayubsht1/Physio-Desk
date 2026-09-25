import { NextResponse } from "next/server";
import { getStore } from "@/lib/server-db";

export async function GET() {
  const store = getStore();
  const dashboard = store.getDashboard();
  return NextResponse.json(dashboard);
}
