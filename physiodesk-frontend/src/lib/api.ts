export const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "/api/v1";

export type Role = "admin" | "staff";
export type Status = "Active" | "Completed" | "On hold";

export type User = {
  id: number;
  username: string;
  email: string;
  full_name: string;
  role: Role;
  is_active?: boolean;
  created_at?: string;
  last_login?: string | null;
  phone?: string | null;
};

export type UserPayload = {
  username: string;
  email: string;
  full_name: string;
  role: Role;
  password?: string;
  is_active?: boolean;
  phone?: string | null;
};

export type ClinicService = {
  id: number;
  service_id: string;
  name: string;
  category: string;
  duration: string;
  price: number;
  price_display: string;
  description: string;
  indications?: string;
  is_active: boolean;
};

export type ServicePayload = {
  service_id?: string;
  name: string;
  category: string;
  duration: string;
  price: number;
  description: string;
  indications?: string;
  is_active?: boolean;
};

export type Patient = {
  id: number;
  first_name: string;
  last_name: string;
  name: string;
  date_of_birth?: string | null;
  age?: number | null;
  gender: string;
  phone: string;
  email?: string | null;
  address?: string | null;
  blood_group?: string | null;
  allergies?: string | null;
  medical_notes?: string | null;
  assigned_therapist_id: number | null;
  status: Status;
  created_at: string;
  is_active: boolean;
  therapist_name?: string | null;
  condition?: string;
  package?: string;
};

export type PatientDetail = {
  patient: Patient;
  session_history: Appointment[];
  billing_history: Invoice[];
};

export type Therapist = {
  id: number;
  name: string;
  specialty: string;
  working_days: string;
  start_time: string;
  end_time: string;
  slot_duration: number;
  is_active: boolean;
  notes?: string | null;
  image?: string;
  nhpc_reg?: string;
};

export type Appointment = {
  id: number;
  patient_id: number;
  therapist_id: number;
  appointment_date: string;
  start_time: string;
  end_time: string;
  status: "Booked" | "Completed" | "Cancelled" | "No-show";
  payment_method?: string | null;
  notes?: string | null;
  patient_name?: string | null;
  therapist_name?: string | null;
  service?: string | null;
  created_at?: string;
};

export type Invoice = {
  id: number;
  patient_id: number;
  service: string;
  invoice_date: string;
  amount: number;
  status: "Paid" | "Due" | "Void";
  payment_method?: string | null;
  discount: number;
  notes?: string | null;
  patient_name?: string | null;
};

export type Dashboard = {
  patients_seen_today: number;
  therapists_on_duty_today: number;
  revenue_collected_today: number;
  open_slots_remaining_today: number;
  recent_patients: Patient[];
  therapist_capacity: {
    therapist_name: string;
    specialty: string;
    booked: number;
    free: number;
  }[];
};

export type PatientPayload = {
  first_name: string;
  last_name: string;
  date_of_birth?: string | null;
  gender: string;
  phone: string;
  email?: string | null;
  address?: string | null;
  blood_group?: string | null;
  allergies?: string | null;
  medical_notes?: string | null;
  assigned_therapist_id?: number | null;
  status?: Status;
  is_active?: boolean;
  condition?: string;
  package?: string;
};

export type TherapistPayload = Omit<Therapist, "id" | "image">;
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
  return raw ? (JSON.parse(raw) as Tokens) : null;
}

async function request<T>(path: string, options: RequestInit = {}, retry = true): Promise<T> {
  const tokens = getTokens();
  const headers = new Headers(options.headers);
  headers.set("Content-Type", "application/json");
  if (tokens?.access_token) headers.set("Authorization", `Bearer ${tokens.access_token}`);
  const response = await fetch(`${API_URL}${path}`, { ...options, headers });
  if (response.status === 401 && retry && tokens?.refresh_token) {
    const refresh = await fetch(`${API_URL}/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh_token: tokens.refresh_token }),
    });
    if (refresh.ok) {
      localStorage.setItem("physiodesk_tokens", JSON.stringify(await refresh.json()));
      return request<T>(path, options, false);
    }
    clearSession();
  }
  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(body.detail ?? body.message ?? `Request failed (${response.status})`);
  }
  return response.status === 204 ? (undefined as T) : response.json();
}

export async function login(username: string, password: string) {
  const tokens = await request<Tokens>(
    "/auth/login",
    { method: "POST", body: JSON.stringify({ username, password }) },
    false
  );
  localStorage.setItem("physiodesk_tokens", JSON.stringify(tokens));
  const user = await request<User>("/auth/me");
  localStorage.setItem("physiodesk_user", JSON.stringify(user));
  return user;
}

export const api = {
  dashboard: () => request<Dashboard>("/dashboard"),
  patients: (params?: { search?: string; therapist_id?: number; status?: string; include_inactive?: boolean }) => {
    const query = new URLSearchParams();
    if (params?.search) query.set("search", params.search);
    if (params?.therapist_id) query.set("therapist_id", String(params.therapist_id));
    if (params?.status) query.set("status", params.status);
    if (params?.include_inactive) query.set("include_inactive", "true");
    const qs = query.toString();
    return request<Patient[]>(`/patients${qs ? `?${qs}` : ""}`);
  },
  patient: (id: number) => request<PatientDetail>(`/patients/${id}`),
  createPatient: (payload: PatientPayload) =>
    request<Patient>("/patients", { method: "POST", body: JSON.stringify(payload) }),
  updatePatient: (id: number, payload: Partial<PatientPayload>) =>
    request<Patient>(`/patients/${id}`, { method: "PUT", body: JSON.stringify(payload) }),
  deletePatient: (id: number) =>
    request<{ message: string }>(`/patients/${id}`, { method: "DELETE" }),
  therapists: () => request<Therapist[]>("/therapists"),
  createTherapist: (payload: TherapistPayload) =>
    request<Therapist>("/therapists", { method: "POST", body: JSON.stringify(payload) }),
  updateTherapist: (id: number, payload: TherapistPayload) =>
    request<Therapist>(`/therapists/${id}`, { method: "PUT", body: JSON.stringify(payload) }),
  deleteTherapist: (id: number) => request<void>(`/therapists/${id}`, { method: "DELETE" }),
  appointments: (query?: { patient_id?: number; therapist_id?: number; date?: string; search?: string }) => {
    const q = new URLSearchParams();
    if (query?.patient_id) q.set("patient_id", String(query.patient_id));
    if (query?.therapist_id) q.set("therapist_id", String(query.therapist_id));
    if (query?.date) q.set("date", query.date);
    if (query?.search) q.set("search", query.search);
    const qs = q.toString();
    return request<Appointment[]>(`/appointments${qs ? `?${qs}` : ""}`);
  },
  createAppointment: (payload: AppointmentPayload) =>
    request<Appointment>("/appointments", { method: "POST", body: JSON.stringify(payload) }),
  updateAppointment: (id: number, payload: Partial<AppointmentPayload>) =>
    request<Appointment>(`/appointments/${id}`, { method: "PUT", body: JSON.stringify(payload) }),
  deleteAppointment: (id: number) => request<void>(`/appointments/${id}`, { method: "DELETE" }),
  invoices: (status = "") => request<Invoice[]>(`/billing${status ? `?status=${status}` : ""}`),
  createInvoice: (payload: InvoicePayload) =>
    request<Invoice>("/billing", { method: "POST", body: JSON.stringify(payload) }),
  updateInvoice: (id: number, payload: InvoicePayload) =>
    request<Invoice>(`/billing/${id}`, { method: "PUT", body: JSON.stringify(payload) }),
  deleteInvoice: (id: number) => request<void>(`/billing/${id}`, { method: "DELETE" }),
  users: (params?: { search?: string; role?: string }) => {
    const q = new URLSearchParams();
    if (params?.search) q.set("search", params.search);
    if (params?.role) q.set("role", params.role);
    const qs = q.toString();
    return request<User[]>(`/users${qs ? `?${qs}` : ""}`);
  },
  createUser: (payload: UserPayload) =>
    request<User>("/users", { method: "POST", body: JSON.stringify(payload) }),
  updateUser: (id: number, payload: Partial<UserPayload>) =>
    request<User>(`/users/${id}`, { method: "PUT", body: JSON.stringify(payload) }),
  deleteUser: (id: number) =>
    request<{ message: string }>(`/users/${id}`, { method: "DELETE" }),
  services: (params?: { category?: string; include_inactive?: boolean }) => {
    const q = new URLSearchParams();
    if (params?.category) q.set("category", params.category);
    if (params?.include_inactive) q.set("include_inactive", "true");
    const qs = q.toString();
    return request<ClinicService[]>(`/services${qs ? `?${qs}` : ""}`);
  },
  createService: (payload: ServicePayload) =>
    request<ClinicService>("/services", { method: "POST", body: JSON.stringify(payload) }),
  updateService: (id: number, payload: Partial<ServicePayload>) =>
    request<ClinicService>(`/services/${id}`, { method: "PUT", body: JSON.stringify(payload) }),
  deleteService: (id: number) =>
    request<{ message: string }>(`/services/${id}`, { method: "DELETE" }),
};
