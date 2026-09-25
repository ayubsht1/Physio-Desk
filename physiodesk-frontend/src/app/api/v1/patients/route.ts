import { NextResponse } from "next/server";
import { getStore, computeAge } from "@/lib/server-db";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const search = searchParams.get("search")?.toLowerCase().trim();
  const therapistId = searchParams.get("therapist_id");
  const statusFilter = searchParams.get("status");
  const includeInactive = searchParams.get("include_inactive") === "true";

  const store = getStore();
  let query = store.patients;

  // Hide inactive / soft-deleted patients by default
  if (!includeInactive) {
    query = query.filter((p) => p.is_active === true);
  }

  if (search) {
    query = query.filter(
      (p) =>
        p.first_name.toLowerCase().includes(search) ||
        p.last_name.toLowerCase().includes(search) ||
        p.phone.toLowerCase().includes(search) ||
        (p.name && p.name.toLowerCase().includes(search))
    );
  }

  if (therapistId) {
    query = query.filter((p) => p.assigned_therapist_id === Number(therapistId));
  }

  if (statusFilter) {
    query = query.filter((p) => p.status === statusFilter);
  }

  // Order by id descending
  const sorted = [...query].sort((a, b) => b.id - a.id);

  const results = sorted.map((patient) => {
    const therapist = patient.assigned_therapist_id
      ? store.therapists.find((t) => t.id === patient.assigned_therapist_id)
      : null;
    return {
      ...patient,
      name: `${patient.first_name} ${patient.last_name}`.trim(),
      age: computeAge(patient.date_of_birth),
      therapist_name: therapist ? therapist.name : null,
    };
  });

  return NextResponse.json(results);
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const store = getStore();

    if (body.assigned_therapist_id) {
      const therapistExists = store.therapists.some((t) => t.id === Number(body.assigned_therapist_id));
      if (!therapistExists) {
        return NextResponse.json({ detail: "Assigned therapist not found" }, { status: 400 });
      }
    }

    const therapist = body.assigned_therapist_id
      ? store.therapists.find((t) => t.id === Number(body.assigned_therapist_id))
      : null;

    const firstName = body.first_name || (body.name ? body.name.split(" ")[0] : "");
    const lastName = body.last_name || (body.name ? body.name.split(" ").slice(1).join(" ") : "");

    const newPatient = {
      id: store.nextPatientId++,
      first_name: firstName,
      last_name: lastName,
      name: `${firstName} ${lastName}`.trim(),
      date_of_birth: body.date_of_birth ?? null,
      age: computeAge(body.date_of_birth),
      gender: body.gender || "Unspecified",
      phone: body.phone,
      email: body.email ?? null,
      address: body.address ?? null,
      blood_group: body.blood_group ?? null,
      allergies: body.allergies ?? null,
      medical_notes: body.medical_notes ?? null,
      assigned_therapist_id: body.assigned_therapist_id ? Number(body.assigned_therapist_id) : null,
      status: body.status || "Active",
      condition: body.condition || body.medical_notes || "General consultation",
      package: body.package || "Single Consultation",
      created_at: new Date().toISOString(),
      is_active: body.is_active !== undefined ? Boolean(body.is_active) : true,
      therapist_name: therapist ? therapist.name : null,
    };

    store.patients.unshift(newPatient);
    return NextResponse.json(newPatient, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { detail: error instanceof Error ? error.message : "Invalid payload" },
      { status: 400 }
    );
  }
}
