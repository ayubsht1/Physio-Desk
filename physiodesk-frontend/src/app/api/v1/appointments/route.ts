import { NextResponse } from "next/server";
import { getStore } from "@/lib/server-db";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const date = searchParams.get("date");
  const therapistId = searchParams.get("therapist_id");
  const patientId = searchParams.get("patient_id");
  const search = searchParams.get("search")?.toLowerCase().trim();
  const store = getStore();

  let list = store.appointments;

  if (date) {
    list = list.filter((a) => a.appointment_date === date);
  }
  if (therapistId) {
    list = list.filter((a) => a.therapist_id === Number(therapistId));
  }
  if (patientId) {
    list = list.filter((a) => a.patient_id === Number(patientId));
  }
  if (search) {
    // Search can match patient name, appointment id, or patient phone number
    const matchingPatients = store.patients.filter(
      (p) =>
        p.phone.toLowerCase().includes(search) ||
        p.name.toLowerCase().includes(search) ||
        (p.email && p.email.toLowerCase().includes(search))
    );
    const matchingPatientIds = new Set(matchingPatients.map((p) => p.id));

    list = list.filter(
      (a) =>
        matchingPatientIds.has(a.patient_id) ||
        (a.patient_name && a.patient_name.toLowerCase().includes(search)) ||
        String(a.id).includes(search) ||
        `pd-apt-${a.id}`.includes(search)
    );
  }

  // Sort by date desc, then start_time
  const sorted = [...list].sort((a, b) => {
    const dComp = b.appointment_date.localeCompare(a.appointment_date);
    if (dComp !== 0) return dComp;
    return (b.start_time || "").localeCompare(a.start_time || "");
  });

  return NextResponse.json(sorted);
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const store = getStore();

    const patient = store.patients.find((p) => p.id === Number(body.patient_id));
    const therapist = store.therapists.find((t) => t.id === Number(body.therapist_id));

    const newAppointment = {
      id: store.nextAppointmentId++,
      patient_id: Number(body.patient_id),
      therapist_id: Number(body.therapist_id),
      appointment_date: body.appointment_date,
      start_time: body.start_time,
      end_time: body.end_time,
      status: body.status || "Booked",
      payment_method: body.payment_method || "Card",
      notes: body.notes || "",
      service: body.service || "Physiotherapy Consultation",
      patient_name: patient ? patient.name : null,
      therapist_name: therapist ? therapist.name : null,
      created_at: new Date().toISOString(),
    };

    store.appointments.push(newAppointment);
    return NextResponse.json(newAppointment, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { detail: error instanceof Error ? error.message : "Invalid payload" },
      { status: 400 }
    );
  }
}
