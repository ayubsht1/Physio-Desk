import { NextResponse } from "next/server";
import { getStore } from "@/lib/server-db";
import { ClinicService } from "@/lib/api";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const category = searchParams.get("category");
  const includeInactive = searchParams.get("include_inactive") === "true";

  const store = getStore();
  let list = store.services;

  if (!includeInactive) {
    list = list.filter((s) => s.is_active);
  }

  if (category) {
    list = list.filter((s) => s.category.toLowerCase() === category.toLowerCase());
  }

  return NextResponse.json(list);
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, category, duration, price, description, indications, is_active } = body;

    if (!name || !price) {
      return NextResponse.json(
        { detail: "Service name and price are required." },
        { status: 400 }
      );
    }

    const store = getStore();
    const numPrice = Number(price);

    const newService: ClinicService = {
      id: store.nextServiceId++,
      service_id: body.service_id || name.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
      name: name.trim(),
      category: category?.trim() || "General Physiotherapy",
      duration: duration?.trim() || "45 min",
      price: numPrice,
      price_display: `Rs. ${numPrice.toLocaleString("en-NP")}`,
      description: description?.trim() || "",
      indications: indications?.trim() || "",
      is_active: is_active !== undefined ? Boolean(is_active) : true,
    };

    store.services.push(newService);
    return NextResponse.json(newService, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { detail: error instanceof Error ? error.message : "Invalid payload" },
      { status: 400 }
    );
  }
}
