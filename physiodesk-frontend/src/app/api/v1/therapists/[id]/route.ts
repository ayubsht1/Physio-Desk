import { NextResponse } from "next/server";
import { getStore } from "@/lib/server-db";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const store = getStore();
    const therapistId = Number(id);

    const index = store.therapists.findIndex((t) => t.id === therapistId);
    if (index === -1) {
      return NextResponse.json({ detail: "Therapist not found" }, { status: 404 });
    }

    const updated = {
      ...store.therapists[index],
      ...body,
      id: therapistId,
    };

    store.therapists[index] = updated;
    return NextResponse.json(updated);
  } catch (error) {
    return NextResponse.json(
      { detail: error instanceof Error ? error.message : "Invalid payload" },
      { status: 400 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const store = getStore();
  const therapistId = Number(id);

  store.therapists = store.therapists.filter((t) => t.id !== therapistId);
  return new NextResponse(null, { status: 204 });
}
