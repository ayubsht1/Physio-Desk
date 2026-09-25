import { NextResponse } from "next/server";
import { getStore } from "@/lib/server-db";

export async function GET() {
  const store = getStore();
  return NextResponse.json(store.therapists);
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const store = getStore();

    const newTherapist = {
      id: store.nextTherapistId++,
      name: body.name,
      specialty: body.specialty,
      working_days: body.working_days || "Mon,Tue,Wed,Thu,Fri",
      start_time: body.start_time || "09:00",
      end_time: body.end_time || "17:00",
      slot_duration: Number(body.slot_duration) || 30,
      is_active: body.is_active !== undefined ? Boolean(body.is_active) : true,
      notes: body.notes || "",
    };

    store.therapists.push(newTherapist);
    return NextResponse.json(newTherapist, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { detail: error instanceof Error ? error.message : "Invalid payload" },
      { status: 400 }
    );
  }
}
