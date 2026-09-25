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
    const apptId = Number(id);

    const index = store.appointments.findIndex((a) => a.id === apptId);
    if (index === -1) {
      return NextResponse.json({ detail: "Appointment not found" }, { status: 404 });
    }

    const patientId = body.patient_id !== undefined ? Number(body.patient_id) : store.appointments[index].patient_id;
    const therapistId = body.therapist_id !== undefined ? Number(body.therapist_id) : store.appointments[index].therapist_id;

    const patient = store.patients.find((p) => p.id === patientId);
    const therapist = store.therapists.find((t) => t.id === therapistId);

    const updated = {
      ...store.appointments[index],
      ...body,
      id: apptId,
      patient_id: patientId,
      therapist_id: therapistId,
      patient_name: patient ? patient.name : store.appointments[index].patient_name,
      therapist_name: therapist ? therapist.name : store.appointments[index].therapist_name,
    };

    store.appointments[index] = updated;
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
  const apptId = Number(id);

  store.appointments = store.appointments.filter((a) => a.id !== apptId);
  return new NextResponse(null, { status: 204 });
}
