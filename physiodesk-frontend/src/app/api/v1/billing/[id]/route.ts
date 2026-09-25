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
    const invoiceId = Number(id);

    const index = store.invoices.findIndex((i) => i.id === invoiceId);
    if (index === -1) {
      return NextResponse.json({ detail: "Invoice not found" }, { status: 404 });
    }

    const patient = body.patient_id
      ? store.patients.find((p) => p.id === Number(body.patient_id))
      : null;

    const updated = {
      ...store.invoices[index],
      ...body,
      id: invoiceId,
      patient_name: patient ? patient.name : store.invoices[index].patient_name,
    };

    store.invoices[index] = updated;
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
  const invoiceId = Number(id);

  store.invoices = store.invoices.filter((i) => i.id !== invoiceId);
  return new NextResponse(null, { status: 204 });
}
