import { NextResponse } from "next/server";
import { getStore, computeAge } from "@/lib/server-db";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const store = getStore();
  const patientId = Number(id);

  const patient = store.patients.find((p) => p.id === patientId);
  if (!patient) {
    return NextResponse.json({ detail: "Patient not found" }, { status: 404 });
  }

  const therapist = patient.assigned_therapist_id
    ? store.therapists.find((t) => t.id === patient.assigned_therapist_id)
    : null;

  const patientRead = {
    ...patient,
    name: `${patient.first_name} ${patient.last_name}`.trim(),
    age: computeAge(patient.date_of_birth),
    therapist_name: therapist ? therapist.name : null,
  };

  const sessionHistory = store.appointments
    .filter((a) => a.patient_id === patientId)
    .sort((a, b) => b.appointment_date.localeCompare(a.appointment_date));

  const billingHistory = store.invoices
    .filter((i) => i.patient_id === patientId)
    .sort((a, b) => b.invoice_date.localeCompare(a.invoice_date));

  return NextResponse.json({
    patient: patientRead,
    session_history: sessionHistory,
    billing_history: billingHistory,
  });
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const store = getStore();
    const patientId = Number(id);

    const index = store.patients.findIndex((p) => p.id === patientId);
    if (index === -1) {
      return NextResponse.json({ detail: "Patient not found" }, { status: 404 });
    }

    if (body.assigned_therapist_id !== undefined && body.assigned_therapist_id !== null) {
      const therapistExists = store.therapists.some((t) => t.id === Number(body.assigned_therapist_id));
      if (!therapistExists) {
        return NextResponse.json({ detail: "Assigned therapist not found" }, { status: 400 });
      }
    }

    const current = store.patients[index];
    const firstName = body.first_name ?? current.first_name;
    const lastName = body.last_name ?? current.last_name;
    const dob = body.date_of_birth !== undefined ? body.date_of_birth : current.date_of_birth;

    const assignedTherapistId =
      body.assigned_therapist_id !== undefined
        ? body.assigned_therapist_id !== null
          ? Number(body.assigned_therapist_id)
          : null
        : current.assigned_therapist_id;

    const therapist = assignedTherapistId
      ? store.therapists.find((t) => t.id === assignedTherapistId)
      : null;

    const updated = {
      ...current,
      ...body,
      id: patientId,
      first_name: firstName,
      last_name: lastName,
      name: `${firstName} ${lastName}`.trim(),
      date_of_birth: dob,
      age: computeAge(dob),
      assigned_therapist_id: assignedTherapistId,
      therapist_name: therapist ? therapist.name : null,
    };

    store.patients[index] = updated;
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
  const patientId = Number(id);

  const patient = store.patients.find((p) => p.id === patientId);
  if (!patient) {
    return NextResponse.json({ detail: "Patient not found" }, { status: 404 });
  }

  if (!patient.is_active) {
    return NextResponse.json({ detail: "Patient is already deactivated" }, { status: 400 });
  }

  // Soft delete by setting is_active to False
  patient.is_active = false;
  return NextResponse.json({ message: "Patient deactivated successfully" }, { status: 200 });
}
