import { NextResponse } from "next/server";
import { getStore } from "@/lib/server-db";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const store = getStore();
  const serviceId = Number(id);

  const service = store.services.find((s) => s.id === serviceId);
  if (!service) {
    return NextResponse.json({ detail: "Service not found" }, { status: 404 });
  }

  return NextResponse.json(service);
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const store = getStore();
    const serviceId = Number(id);

    const index = store.services.findIndex((s) => s.id === serviceId);
    if (index === -1) {
      return NextResponse.json({ detail: "Service not found" }, { status: 404 });
    }

    const current = store.services[index];
    const newPrice = body.price !== undefined ? Number(body.price) : current.price;

    const updated = {
      ...current,
      name: body.name !== undefined ? body.name.trim() : current.name,
      category: body.category !== undefined ? body.category.trim() : current.category,
      duration: body.duration !== undefined ? body.duration.trim() : current.duration,
      price: newPrice,
      price_display: `Rs. ${newPrice.toLocaleString("en-NP")}`,
      description: body.description !== undefined ? body.description.trim() : current.description,
      indications: body.indications !== undefined ? body.indications.trim() : current.indications,
      is_active: body.is_active !== undefined ? Boolean(body.is_active) : current.is_active,
    };

    store.services[index] = updated;
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
  const serviceId = Number(id);

  const exists = store.services.some((s) => s.id === serviceId);
  if (!exists) {
    return NextResponse.json({ detail: "Service not found" }, { status: 404 });
  }

  store.services = store.services.filter((s) => s.id !== serviceId);
  return NextResponse.json({ message: "Service deleted successfully." });
}
