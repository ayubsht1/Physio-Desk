export const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://127.0.0.1:8000/api/v1";

export type Role = "admin" | "staff";
export type Status = "Active" | "Completed" | "On hold";

export type User = { id: number; username: string; email: string; full_name: string; role: Role };
export type Patient = { id: number; name: string; phone: string; age: number; gender: string; address: string; condition: string; assigned_therapist_id: number | null; package: string; status: Status; created_at: string; therapist_name?: string | null };
export type Therapist = { id: number; name: string; specialty: string; working_days: string; start_time: string; end_time: string; slot_duration: number; is_active: boolean; notes?: string | null };
export type Appointment = { id: number; patient_id: number; therapist_id: number; appointment_date: string; start_time: string; end_time: string; status: "Booked" | "Completed" | "Cancelled" | "No-show"; payment_method?: string | null; notes?: string | null; patient_name?: string | null; therapist_name?: string | null };
export type Invoice = { id: number; patient_id: number; service: string; invoice_date: string; amount: number; status: "Paid" | "Due" | "Void"; payment_method?: string | null; discount: number; notes?: string | null; patient_name?: string | null };
export type Dashboard = { patients_seen_today: number; therapists_on_duty_today: number; revenue_collected_today: number; open_slots_remaining_today: number; recent_patients: Patient[]; therapist_capacity: { therapist_name: string; specialty: string; booked: number; free: number }[] };

export type PatientPayload = Omit<Patient, "id" | "created_at" | "therapist_name"> & { created_at?: string };
export type TherapistPayload = Omit<Therapist, "id">;
export type AppointmentPayload = Omit<Appointment, "id" | "patient_name" | "therapist_name">;
export type InvoicePayload = Omit<Invoice, "id" | "patient_name">;

type Tokens = { access_token: string; refresh_token: string; token_type: string };

export function clearSession() {
  if (typeof window !== "undefined") {
    localStorage.removeItem("physiodesk_tokens");
    localStorage.removeItem("physiodesk_user");
  }
}

function getTokens(): Tokens | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem("physiodesk_tokens");
  return raw ? JSON.parse(raw) as Tokens : null;
}

async function request<T>(path: string, options: RequestInit = {}, retry = true): Promise<T> {
  const tokens = getTokens();
  const headers = new Headers(options.headers);
  headers.set("Content-Type", "application/json");
  if (tokens?.access_token) headers.set("Authorization", `Bearer ${tokens.access_token}`);
  const response = await fetch(`${API_URL}${path}`, { ...options, headers });
  if (response.status === 401 && retry && tokens?.refresh_token) {
    const refresh = await fetch(`${API_URL}/auth/refresh`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ refresh_token: tokens.refresh_token }) });
    if (refresh.ok) {
      localStorage.setItem("physiodesk_tokens", JSON.stringify(await refresh.json()));
      return request<T>(path, options, false);
    }
    clearSession();
  }
  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(body.detail ?? `Request failed (${response.status})`);
  }
  return response.status === 204 ? (undefined as T) : response.json();
}

export async function login(username: string, password: string) {
  const tokens = await request<Tokens>("/auth/login", { method: "POST", body: JSON.stringify({ username, password }) }, false);
  localStorage.setItem("physiodesk_tokens", JSON.stringify(tokens));
  const user = await request<User>("/auth/me");
  localStorage.setItem("physiodesk_user", JSON.stringify(user));
  return user;
}

export const api = {
  dashboard: () => request<Dashboard>("/dashboard"),
  patients: (query = "") => request<Patient[]>(`/patients${query ? `?search=${encodeURIComponent(query)}` : ""}`),
  patient: (id: number) => request<{ patient: Patient; session_history: Appointment[]; billing_history: Invoice[] }>(`/patients/${id}`),
  createPatient: (payload: PatientPayload) => request<Patient>("/patients", { method: "POST", body: JSON.stringify(payload) }),
  updatePatient: (id: number, payload: Partial<PatientPayload>) => request<Patient>(`/patients/${id}`, { method: "PUT", body: JSON.stringify(payload) }),
  deletePatient: (id: number) => request<void>(`/patients/${id}`, { method: "DELETE" }),
  therapists: () => request<Therapist[]>("/therapists"),
  createTherapist: (payload: TherapistPayload) => request<Therapist>("/therapists", { method: "POST", body: JSON.stringify(payload) }),
  updateTherapist: (id: number, payload: TherapistPayload) => request<Therapist>(`/therapists/${id}`, { method: "PUT", body: JSON.stringify(payload) }),
  deleteTherapist: (id: number) => request<void>(`/therapists/${id}`, { method: "DELETE" }),
  appointments: () => request<Appointment[]>("/appointments"),
  createAppointment: (payload: AppointmentPayload) => request<Appointment>("/appointments", { method: "POST", body: JSON.stringify(payload) }),
  updateAppointment: (id: number, payload: AppointmentPayload) => request<Appointment>(`/appointments/${id}`, { method: "PUT", body: JSON.stringify(payload) }),
  invoices: (status = "") => request<Invoice[]>(`/billing${status ? `?status=${status}` : ""}`),
  createInvoice: (payload: InvoicePayload) => request<Invoice>("/billing", { method: "POST", body: JSON.stringify(payload) }),
  updateInvoice: (id: number, payload: InvoicePayload) => request<Invoice>(`/billing/${id}`, { method: "PUT", body: JSON.stringify(payload) }),
  deleteInvoice: (id: number) => request<void>(`/billing/${id}`, { method: "DELETE" }),
};
