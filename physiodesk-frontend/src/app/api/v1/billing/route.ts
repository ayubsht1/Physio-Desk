import { NextResponse } from "next/server";
import { getStore } from "@/lib/server-db";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status");
  const store = getStore();

  let invoices = store.invoices;
  if (status) {
    invoices = invoices.filter((i) => i.status === status);
  }

  return NextResponse.json(invoices);
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const store = getStore();

    const patient = store.patients.find((p) => p.id === Number(body.patient_id));

    const newInvoice = {
      id: store.nextInvoiceId++,
      patient_id: Number(body.patient_id),
      service: body.service,
      invoice_date: body.invoice_date || new Date().toISOString().slice(0, 10),
      amount: Number(body.amount),
      discount: Number(body.discount) || 0,
      status: body.status || "Due",
      payment_method: body.payment_method || "Card",
      notes: body.notes || "",
      patient_name: patient ? patient.name : null,
    };

    store.invoices.unshift(newInvoice);
    return NextResponse.json(newInvoice, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { detail: error instanceof Error ? error.message : "Invalid payload" },
      { status: 400 }
    );
  }
}
