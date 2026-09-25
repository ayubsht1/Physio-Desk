"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Users,
  Calendar as CalendarIcon,
  Receipt,
  Stethoscope,
  LayoutDashboard,
  LogOut,
  ArrowLeft,
  Plus,
  Search,
  Clock,
  DollarSign,
  Trash2,
  Edit2,
  Eye,
  X,
  ShieldAlert,
  UserCog,
  ShieldCheck,
  UserCheck,
  Sparkles,
  Download,
} from "lucide-react";
import {
  api,
  Appointment,
  AppointmentPayload,
  ClinicService,
  Dashboard,
  Invoice,
  InvoicePayload,
  login,
  Patient,
  PatientPayload,
  PatientDetail,
  Role,
  ServicePayload,
  Therapist,
  TherapistPayload,
  User,
  UserPayload,
  clearSession,
} from "@/lib/api";

type View =
  | "Dashboard"
  | "Patients"
  | "Schedule"
  | "Billing"
  | "Therapists"
  | "Services"
  | "Users";

function money(value: number) {
  return `Rs. ${Number(value || 0).toLocaleString("en-NP")}`;
}

async function downloadInvoicePdf(invoice: Invoice) {
  const { jsPDF } = await import("jspdf");
  const document = new jsPDF();
  const subtotal = invoice.subtotal ?? invoice.amount;
  const discount = invoice.discount ?? 0;
  const total = invoice.total ?? Math.max(subtotal - discount, 0);
  const invoiceNumber = invoice.invoice_number ?? `INV-${invoice.id}`;

  document.setFillColor(19, 36, 32);
  document.rect(0, 0, 210, 38, "F");
  document.setTextColor(240, 223, 199);
  document.setFontSize(22);
  document.text("Physio Desk", 20, 18);
  document.setFontSize(10);
  document.text("Rehabilitation & Performance Clinic", 20, 27);

  document.setTextColor(24, 34, 30);
  document.setFontSize(16);
  document.text("INVOICE", 20, 58);
  document.setFontSize(10);
  document.text(`Invoice: ${invoiceNumber}`, 20, 67);
  document.text(`Date: ${invoice.invoice_date}`, 20, 74);
  document.text(`Status: ${invoice.status}`, 140, 67);

  document.setDrawColor(222, 213, 194);
  document.line(20, 84, 190, 84);
  document.setFontSize(11);
  document.text("Bill to", 20, 97);
  document.setFontSize(12);
  document.text(invoice.patient_name ?? "Patient", 20, 106);
  document.setFontSize(10);
  document.text(invoice.service ?? "Physiotherapy treatment", 20, 116);

  document.line(20, 129, 190, 129);
  document.text("Description", 20, 140);
  document.text("Amount", 158, 140);
  document.line(20, 145, 190, 145);
  document.text(invoice.service ?? "Treatment session", 20, 156);
  document.text(money(subtotal), 158, 156);
  document.text("Discount", 20, 167);
  document.text(`-${money(discount)}`, 158, 167);
  document.line(20, 174, 190, 174);
  document.setFontSize(12);
  document.text("Total", 20, 187);
  document.text(money(total), 158, 187);

  if (invoice.notes) {
    document.setFontSize(10);
    document.text("Notes", 20, 207);
    document.text(document.splitTextToSize(invoice.notes, 170), 20, 216);
  }

  document.setTextColor(113, 106, 93);
  document.setFontSize(9);
  document.text("Thank you for choosing Physio Desk.", 20, 278);
  document.save(`${invoiceNumber}.pdf`);
}

function StatusBadge({ text }: { text: string }) {
  const isGood = ["Paid", "Active", "Completed", "Booked"].includes(text);
  const isBad = ["Overdue", "Cancelled", "Void", "No-show"].includes(text);

  const style = isBad
    ? "bg-[#fbeaea] text-[#b5493b] border-[#f1c5c1]"
    : isGood
    ? "bg-[#e1ebe3] text-[#3b664e] border-[#bed4c3]"
    : "bg-[#e7ebee] text-[#4a5568] border-[#cbd5e1]";

  return (
    <span
      className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-semibold tracking-wide border ${style}`}
    >
      {text}
    </span>
  );
}

function Modal({
  title,
  children,
  onClose,
  maxWidth = "max-w-2xl",
}: {
  title: string;
  children: React.ReactNode;
  onClose: () => void;
  maxWidth?: string;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#132420]/60 backdrop-blur-xs"
      onClick={onClose}
    >
      <div
        className={`bg-white border border-[#ded5c2] rounded-2xl shadow-2xl w-full ${maxWidth} max-h-[90vh] overflow-y-auto`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#eee7d8] sticky top-0 bg-white z-10">
          <h3 className="text-lg font-serif font-semibold text-[#18221e]">{title}</h3>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-[#716a5d] hover:text-[#18221e] hover:bg-[#f4ede1] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}

// ----------------- LOGIN COMPONENT -----------------
function LoginView({ onLogin }: { onLogin: (user: User) => void }) {
  const [username, setUsername] = useState("admin");
  const [password, setPassword] = useState("admin123");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      const u = await login(username, password);
      onLogin(u);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to sign in");
    } finally {
      setBusy(false);
    }
  }

  const quickLogin = async (u: string, p: string) => {
    setUsername(u);
    setPassword(p);
    setBusy(true);
    setError("");
    try {
      const logged = await login(u, p);
      onLogin(logged);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to sign in");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-center items-center p-4 bg-[#fbf9f4]">
      <div className="mb-6 flex items-center justify-between w-full max-w-md">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#5c3a17] hover:text-[#18221e]"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to Patient Portal
        </Link>
      </div>

      <div className="w-full max-w-md bg-white border border-[#ded5c2] rounded-2xl shadow-xl p-8 space-y-6">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-xl bg-[#132420] text-[#f0dfc7] font-serif text-2xl font-bold flex items-center justify-center mx-auto">
            P
          </div>
          <h1 className="text-2xl font-serif font-semibold text-[#18221e]">
            Staff & Doctor Workspace
          </h1>
          <p className="text-xs text-[#716a5d]">
            Sign in to manage patient charts, doctor schedules, and clinical invoices.
          </p>
        </div>

        <form onSubmit={submit} className="space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-[#554d40]">Username or Email</label>
            <input
              type="text"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-[#fdfcf9] border border-[#d9d0be] rounded-xl text-sm text-[#18221e] focus:outline-hidden focus:border-[#b8763a]"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-[#554d40]">Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-[#fdfcf9] border border-[#d9d0be] rounded-xl text-sm text-[#18221e] focus:outline-hidden focus:border-[#b8763a]"
            />
          </div>

          {error && (
            <div className="p-3 bg-[#fbeaea] border border-[#f1c5c1] text-[#b5493b] text-xs rounded-xl">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={busy}
            className="w-full py-3 bg-[#b8763a] hover:bg-[#a3652e] text-white font-semibold text-sm rounded-xl transition-all shadow-sm"
          >
            {busy ? "Signing in..." : "Sign into Workspace"}
          </button>
        </form>

        {/* 1-Click Demo Logins */}
        <div className="pt-4 border-t border-[#f0e8da] space-y-2">
          <span className="text-[11px] font-semibold text-[#857d6f] uppercase tracking-wider block text-center">
            One-Click Clinical Demo Sign-In
          </span>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => quickLogin("admin", "admin123")}
              className="p-2.5 bg-[#faf5ec] hover:bg-[#f4ede1] border border-[#edd9be] rounded-xl text-left transition-colors"
            >
              <div className="text-xs font-bold text-[#18221e]">Dr. Aisha Patel</div>
              <div className="text-[10px] text-[#b8763a] font-medium">Administrator</div>
            </button>

            <button
              type="button"
              onClick={() => quickLogin("staff", "staff123")}
              className="p-2.5 bg-[#faf5ec] hover:bg-[#f4ede1] border border-[#edd9be] rounded-xl text-left transition-colors"
            >
              <div className="text-xs font-bold text-[#18221e]">Sam Rivera</div>
              <div className="text-[10px] text-[#4f7c63] font-medium">Reception Staff</div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ----------------- OVERVIEW COMPONENT -----------------
function OverviewTab({
  dashboard,
  onNavigate,
}: {
  dashboard: Dashboard | null;
  onNavigate: (view: View) => void;
}) {
  if (!dashboard) {
    return (
      <div className="p-12 text-center text-sm text-[#716a5d] bg-white rounded-2xl border border-[#ded5c2]">
        Loading clinic telemetry...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 4 Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 bg-white border border-[#ded5c2] rounded-2xl shadow-xs">
          <div className="flex items-center justify-between text-[#716a5d] text-xs">
            <span className="font-semibold uppercase tracking-wider">Patients Seen Today</span>
            <Users className="w-4 h-4 text-[#b8763a]" />
          </div>
          <div className="text-3xl font-serif font-bold text-[#18221e] mt-2 tabular-nums">
            {dashboard.patients_seen_today}
          </div>
          <div className="text-[11px] text-[#716a5d] mt-1">Completed therapy sessions</div>
        </div>

        <div className="p-5 bg-white border border-[#ded5c2] rounded-2xl shadow-xs">
          <div className="flex items-center justify-between text-[#716a5d] text-xs">
            <span className="font-semibold uppercase tracking-wider">Therapists On Duty</span>
            <Stethoscope className="w-4 h-4 text-[#b8763a]" />
          </div>
          <div className="text-3xl font-serif font-bold text-[#18221e] mt-2 tabular-nums">
            {dashboard.therapists_on_duty_today}
          </div>
          <div className="text-[11px] text-[#716a5d] mt-1">Active staff consulting today</div>
        </div>

        <div className="p-5 bg-white border border-[#ded5c2] rounded-2xl shadow-xs">
          <div className="flex items-center justify-between text-[#716a5d] text-xs">
            <span className="font-semibold uppercase tracking-wider">Revenue Collected</span>
            <DollarSign className="w-4 h-4 text-[#4f7c63]" />
          </div>
          <div className="text-3xl font-serif font-bold text-[#18221e] mt-2 tabular-nums">
            {money(dashboard.revenue_collected_today)}
          </div>
          <div className="text-[11px] text-[#716a5d] mt-1">Paid invoices today</div>
        </div>

        <div className="p-5 bg-white border border-[#ded5c2] rounded-2xl shadow-xs">
          <div className="flex items-center justify-between text-[#716a5d] text-xs">
            <span className="font-semibold uppercase tracking-wider">Open Slots Remaining</span>
            <Clock className="w-4 h-4 text-[#b8763a]" />
          </div>
          <div className="text-3xl font-serif font-bold text-[#18221e] mt-2 tabular-nums">
            {dashboard.open_slots_remaining_today}
          </div>
          <div className="text-[11px] text-[#716a5d] mt-1">Available across providers</div>
        </div>
      </div>

      {/* 2 Columns: Capacity & Recent Patients */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Capacity */}
        <div className="lg:col-span-7 bg-white border border-[#ded5c2] rounded-2xl p-6 shadow-xs space-y-5">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-serif font-semibold text-[#18221e]">
              Therapist Daily Capacity
            </h3>
            <button
              onClick={() => onNavigate("Schedule")}
              className="text-xs font-semibold text-[#b8763a] hover:underline"
            >
              View Full Schedule →
            </button>
          </div>

          <div className="space-y-4">
            {dashboard.therapist_capacity.map((cap) => {
              const total = Math.max(cap.booked + cap.free, 1);
              const pct = Math.round((cap.booked / total) * 100);

              return (
                <div key={cap.therapist_name} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <div>
                      <span className="font-bold text-[#18221e]">{cap.therapist_name}</span>
                      <span className="text-[#857d6f] ml-1.5">({cap.specialty})</span>
                    </div>
                    <span className="font-mono text-[#554d40]">
                      {cap.booked} booked / {cap.free} free ({pct}%)
                    </span>
                  </div>
                  <div className="w-full h-2.5 bg-[#f0dfc7] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[#b8763a] rounded-full transition-all"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Recent Patients */}
        <div className="lg:col-span-5 bg-white border border-[#ded5c2] rounded-2xl p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-serif font-semibold text-[#18221e]">
              Recent Clinical Patients
            </h3>
            <button
              onClick={() => onNavigate("Patients")}
              className="text-xs font-semibold text-[#b8763a] hover:underline"
            >
              All Records →
            </button>
          </div>

          <div className="divide-y divide-[#f0e8da]">
            {dashboard.recent_patients.map((p) => (
              <div key={p.id} className="py-3 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="text-xs font-bold text-[#18221e] truncate">{p.name}</div>
                  <div className="text-[11px] text-[#716a5d] truncate">
                    {p.condition} · {p.therapist_name || "Unassigned"}
                  </div>
                </div>
                <StatusBadge text={p.status} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ----------------- PATIENTS TAB (NEW MODEL) -----------------
function PatientsTab({
  patients,
  therapists,
  onReload,
}: {
  patients: Patient[];
  therapists: Therapist[];
  onReload: () => Promise<void>;
}) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [therapistFilter, setTherapistFilter] = useState("");
  const [includeInactive, setIncludeInactive] = useState(false);

  // Modals
  const [viewingPatient, setViewingPatient] = useState<PatientDetail | null>(null);
  const [editingPatient, setEditingPatient] = useState<Patient | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [deactivatingId, setDeactivatingId] = useState<number | null>(null);
  const [actionError, setActionError] = useState("");

  const filteredPatients = useMemo(() => {
    return patients.filter((p) => {
      // Inactive check
      if (!includeInactive && !p.is_active) return false;
      // Search check
      if (search.trim()) {
        const q = search.toLowerCase();
        const matches =
          p.first_name.toLowerCase().includes(q) ||
          p.last_name.toLowerCase().includes(q) ||
          p.phone.toLowerCase().includes(q) ||
          (p.name && p.name.toLowerCase().includes(q));
        if (!matches) return false;
      }
      // Status check
      if (statusFilter && p.status !== statusFilter) return false;
      // Therapist check
      if (therapistFilter && p.assigned_therapist_id !== Number(therapistFilter)) return false;

      return true;
    });
  }, [patients, search, statusFilter, therapistFilter, includeInactive]);

  const openPatientDetail = async (id: number) => {
    try {
      const detail = await api.patient(id);
      setViewingPatient(detail);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Failed to load patient detail");
    }
  };

  const handleDeactivate = async (id: number) => {
    if (!confirm("Are you sure you want to deactivate/archive this patient record?")) return;
    setDeactivatingId(id);
    setActionError("");
    try {
      await api.deletePatient(id);
      if (viewingPatient?.patient.id === id) {
        setViewingPatient(null);
      }
      await onReload();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Unable to deactivate patient");
    } finally {
      setDeactivatingId(null);
    }
  };

  return (
    <div className="space-y-4">
      {/* Controls Bar */}
      <div className="bg-white border border-[#ded5c2] rounded-2xl p-4 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <div className="flex-1 flex flex-col sm:flex-row gap-2.5">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-[#8a8172] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by first name, last name, phone..."
              className="w-full pl-9 pr-3 py-2 bg-[#fdfcf9] border border-[#d9d0be] rounded-xl text-xs text-[#18221e] focus:outline-hidden focus:border-[#b8763a]"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 bg-[#fdfcf9] border border-[#d9d0be] rounded-xl text-xs text-[#18221e] focus:outline-hidden"
          >
            <option value="">All Statuses</option>
            <option>Active</option>
            <option>Completed</option>
            <option>On hold</option>
          </select>

          <select
            value={therapistFilter}
            onChange={(e) => setTherapistFilter(e.target.value)}
            className="px-3 py-2 bg-[#fdfcf9] border border-[#d9d0be] rounded-xl text-xs text-[#18221e] focus:outline-hidden"
          >
            <option value="">All Therapists</option>
            {therapists.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 text-xs text-[#716a5d] cursor-pointer">
            <input
              type="checkbox"
              checked={includeInactive}
              onChange={(e) => setIncludeInactive(e.target.checked)}
              className="rounded border-[#d9d0be] text-[#b8763a] focus:ring-[#f0dfc7]"
            />
            <span>Include Inactive</span>
          </label>

          <button
            onClick={() => setIsAdding(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#b8763a] hover:bg-[#a3652e] text-white text-xs font-semibold rounded-xl shadow-xs transition-colors shrink-0"
          >
            <Plus className="w-4 h-4" />
            Add Patient
          </button>
        </div>
      </div>

      {actionError && (
        <div className="p-3 bg-[#fbeaea] border border-[#f1c5c1] text-[#b5493b] text-xs rounded-xl">
          {actionError}
        </div>
      )}

      {/* Patients Table */}
      <div className="bg-white border border-[#ded5c2] rounded-2xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-[#fcfaf5] text-[#716a5d] uppercase tracking-wider text-[10px] border-b border-[#eee7d8]">
                <th className="py-3 px-4 font-semibold">Patient Name</th>
                <th className="py-3 px-4 font-semibold">Age / Gender</th>
                <th className="py-3 px-4 font-semibold">Contact</th>
                <th className="py-3 px-4 font-semibold">Blood / Allergies</th>
                <th className="py-3 px-4 font-semibold">Doctor</th>
                <th className="py-3 px-4 font-semibold">Status</th>
                <th className="py-3 px-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#f0e8da]">
              {filteredPatients.map((p) => (
                <tr
                  key={p.id}
                  className={`hover:bg-[#faf7f0] transition-colors ${
                    !p.is_active ? "opacity-60 bg-[#f9f8f5]" : ""
                  }`}
                >
                  <td className="py-3 px-4">
                    <div className="font-bold text-[#18221e]">
                      {p.first_name} {p.last_name}
                    </div>
                    <div className="text-[11px] text-[#716a5d] truncate max-w-[180px]">
                      {p.condition || p.medical_notes || "General Consultation"}
                    </div>
                  </td>
                  <td className="py-3 px-4 text-[#554d40]">
                    <div>{p.age !== null ? `${p.age} yrs` : "N/A"}</div>
                    <div className="text-[10px] text-[#857d6f]">{p.gender}</div>
                  </td>
                  <td className="py-3 px-4 font-mono text-[#554d40]">
                    <div>{p.phone}</div>
                    <div className="text-[10px] text-[#857d6f] font-sans truncate max-w-[140px]">
                      {p.email || "No email"}
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <span className="font-mono font-bold text-[#b8763a]">
                      {p.blood_group || "—"}
                    </span>
                    <div className="text-[10px] text-[#716a5d] truncate max-w-[120px]">
                      {p.allergies ? `Allergies: ${p.allergies}` : "None"}
                    </div>
                  </td>
                  <td className="py-3 px-4 text-[#554d40]">
                    {p.therapist_name || "Unassigned"}
                  </td>
                  <td className="py-3 px-4">
                    <StatusBadge text={p.is_active ? p.status : "Deactivated"} />
                  </td>
                  <td className="py-3 px-4 text-right space-x-1 whitespace-nowrap">
                    <button
                      onClick={() => openPatientDetail(p.id)}
                      className="p-1.5 text-[#5c3a17] hover:bg-[#faf5ec] rounded-lg transition-colors"
                      title="View Clinical Dossier"
                    >
                      <Eye className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setEditingPatient(p)}
                      className="p-1.5 text-[#5c3a17] hover:bg-[#faf5ec] rounded-lg transition-colors"
                      title="Edit Patient"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    {p.is_active && (
                      <button
                        onClick={() => handleDeactivate(p.id)}
                        disabled={deactivatingId === p.id}
                        className="p-1.5 text-[#b5493b] hover:bg-[#fbeaea] rounded-lg transition-colors"
                        title="Deactivate Patient"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredPatients.length === 0 && (
            <div className="p-8 text-center text-xs text-[#716a5d]">
              No patient records matching your filter parameters.
            </div>
          )}
        </div>
      </div>

      {/* Patient Clinical Dossier Modal */}
      {viewingPatient && (
        <Modal
          title={`Clinical Record: ${viewingPatient.patient.name}`}
          onClose={() => setViewingPatient(null)}
          maxWidth="max-w-3xl"
        >
          <div className="space-y-6 text-xs text-[#554d40]">
            {/* Demographic Profile */}
            <div className="p-4 bg-[#faf7f0] border border-[#ded5c2] rounded-xl grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div>
                <span className="text-[#857d6f] text-[10px] uppercase block">Date of Birth</span>
                <span className="font-semibold text-sm text-[#18221e]">
                  {viewingPatient.patient.date_of_birth || "Not documented"}
                </span>
                <span className="text-[11px] text-[#716a5d] block">
                  {viewingPatient.patient.age ? `${viewingPatient.patient.age} years old` : ""}
                </span>
              </div>
              <div>
                <span className="text-[#857d6f] text-[10px] uppercase block">Gender & Blood</span>
                <span className="font-semibold text-sm text-[#18221e]">
                  {viewingPatient.patient.gender}
                </span>
                <span className="text-[11px] font-mono text-[#b8763a] font-bold block">
                  {viewingPatient.patient.blood_group ? `Type: ${viewingPatient.patient.blood_group}` : ""}
                </span>
              </div>
              <div>
                <span className="text-[#857d6f] text-[10px] uppercase block">Contact Phone</span>
                <span className="font-mono font-semibold text-[#18221e]">
                  {viewingPatient.patient.phone}
                </span>
                <span className="text-[11px] text-[#716a5d] block truncate">
                  {viewingPatient.patient.email || "No email"}
                </span>
              </div>
              <div>
                <span className="text-[#857d6f] text-[10px] uppercase block">Assigned Doctor</span>
                <span className="font-semibold text-[#18221e] block">
                  {viewingPatient.patient.therapist_name || "Unassigned"}
                </span>
                <StatusBadge text={viewingPatient.patient.status} />
              </div>
            </div>

            {/* Medical alerts & notes */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-3 bg-[#fcfaf5] border border-[#ded5c2] rounded-xl space-y-1">
                <span className="font-semibold text-[#b5493b] flex items-center gap-1.5">
                  <ShieldAlert className="w-3.5 h-3.5" />
                  Known Allergies
                </span>
                <p className="text-xs text-[#18221e]">
                  {viewingPatient.patient.allergies || "No drug or contact allergies recorded."}
                </p>
              </div>

              <div className="p-3 bg-[#fcfaf5] border border-[#ded5c2] rounded-xl space-y-1">
                <span className="font-semibold text-[#554d40]">Address / Residence</span>
                <p className="text-xs text-[#18221e]">
                  {viewingPatient.patient.address || "No residential address provided."}
                </p>
              </div>
            </div>

            <div className="p-3.5 bg-white border border-[#ded5c2] rounded-xl space-y-1">
              <span className="font-semibold text-[#18221e] block">Clinical Notes & Assessment</span>
              <p className="text-xs text-[#6e675a] leading-relaxed">
                {viewingPatient.patient.medical_notes || "No additional clinical notes."}
              </p>
            </div>

            {/* Session History */}
            <div className="space-y-2 pt-2">
              <h4 className="text-sm font-serif font-semibold text-[#18221e]">
                Consultation & Therapy History ({viewingPatient.session_history.length})
              </h4>
              <div className="border border-[#ded5c2] rounded-xl overflow-hidden divide-y divide-[#f0e8da]">
                {viewingPatient.session_history.map((s) => (
                  <div key={s.id} className="p-3 flex items-center justify-between text-xs">
                    <div>
                      <div className="font-semibold text-[#18221e]">
                        {s.appointment_date} · {s.start_time} - {s.end_time}
                      </div>
                      <div className="text-[11px] text-[#716a5d]">
                        {s.therapist_name} · {s.notes}
                      </div>
                    </div>
                    <StatusBadge text={s.status} />
                  </div>
                ))}
                {viewingPatient.session_history.length === 0 && (
                  <div className="p-4 text-center text-[#716a5d]">No appointment history recorded.</div>
                )}
              </div>
            </div>

            {/* Billing History */}
            <div className="space-y-2 pt-2">
              <h4 className="text-sm font-serif font-semibold text-[#18221e]">
                Invoicing History ({viewingPatient.billing_history.length})
              </h4>
              <div className="border border-[#ded5c2] rounded-xl overflow-hidden divide-y divide-[#f0e8da]">
                {viewingPatient.billing_history.map((inv) => (
                  <div key={inv.id} className="p-3 flex items-center justify-between text-xs">
                    <div>
                      <div className="font-semibold text-[#18221e]">{inv.service}</div>
                      <div className="text-[11px] text-[#716a5d]">{inv.invoice_date}</div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-mono font-semibold text-[#18221e]">
                        {money(inv.amount - inv.discount)}
                      </span>
                      <StatusBadge text={inv.status} />
                    </div>
                  </div>
                ))}
                {viewingPatient.billing_history.length === 0 && (
                  <div className="p-4 text-center text-[#716a5d]">No invoices issued.</div>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-between items-center pt-4 border-t border-[#eee7d8]">
              {viewingPatient.patient.is_active && (
                <button
                  onClick={() => handleDeactivate(viewingPatient.patient.id)}
                  className="px-3.5 py-2 text-xs font-semibold text-[#b5493b] hover:bg-[#fbeaea] rounded-xl transition-colors"
                >
                  Deactivate Patient
                </button>
              )}
              <div className="flex items-center gap-2 ml-auto">
                <button
                  onClick={() => {
                    setEditingPatient(viewingPatient.patient);
                    setViewingPatient(null);
                  }}
                  className="px-4 py-2 text-xs font-semibold text-[#18221e] bg-[#f4ede1] hover:bg-[#eae1d0] rounded-xl transition-colors"
                >
                  Edit Profile
                </button>
                <button
                  onClick={() => setViewingPatient(null)}
                  className="px-4 py-2 text-xs font-semibold text-white bg-[#b8763a] hover:bg-[#a3652e] rounded-xl transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </Modal>
      )}

      {/* Add / Edit Patient Form */}
      {(isAdding || editingPatient) && (
        <PatientFormModal
          initial={editingPatient ?? undefined}
          therapists={therapists}
          onClose={() => {
            setIsAdding(false);
            setEditingPatient(null);
          }}
          onSave={async (payload) => {
            if (editingPatient) {
              await api.updatePatient(editingPatient.id, payload);
            } else {
              await api.createPatient(payload);
            }
            setIsAdding(false);
            setEditingPatient(null);
            await onReload();
          }}
        />
      )}
    </div>
  );
}

// ----------------- PATIENT FORM MODAL -----------------
function PatientFormModal({
  initial,
  therapists,
  onClose,
  onSave,
}: {
  initial?: Patient;
  therapists: Therapist[];
  onClose: () => void;
  onSave: (payload: PatientPayload) => Promise<void>;
}) {
  const [firstName, setFirstName] = useState(
    initial?.first_name || (initial?.name ? initial.name.split(" ")[0] : "")
  );
  const [lastName, setLastName] = useState(
    initial?.last_name || (initial?.name ? initial.name.split(" ").slice(1).join(" ") : "")
  );
  const [phone, setPhone] = useState(initial?.phone || "");
  const [email, setEmail] = useState(initial?.email || "");
  const [dateOfBirth, setDateOfBirth] = useState(initial?.date_of_birth || "");
  const [gender, setGender] = useState(initial?.gender || "Female");
  const [address, setAddress] = useState(initial?.address || "");
  const [bloodGroup, setBloodGroup] = useState(initial?.blood_group || "");
  const [allergies, setAllergies] = useState(initial?.allergies || "");
  const [medicalNotes, setMedicalNotes] = useState(initial?.medical_notes || initial?.condition || "");
  const [assignedTherapistId, setAssignedTherapistId] = useState<number | null>(
    initial?.assigned_therapist_id ?? null
  );
  const [status, setStatus] = useState<PatientPayload["status"]>(initial?.status || "Active");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError("");

    try {
      await onSave({
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        phone: phone.trim(),
        email: email.trim() || null,
        date_of_birth: dateOfBirth || null,
        gender,
        address: address.trim() || null,
        blood_group: bloodGroup.trim() || null,
        allergies: allergies.trim() || null,
        medical_notes: medicalNotes.trim() || null,
        assigned_therapist_id: assignedTherapistId,
        status,
        condition: medicalNotes.trim() || "Physical Therapy",
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save patient");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal title={initial ? "Edit Patient Record" : "Register New Patient"} onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4 text-xs">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          <div className="space-y-1">
            <label className="font-semibold text-[#554d40]">First Name *</label>
            <input
              required
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              className="w-full px-3 py-2 bg-[#fdfcf9] border border-[#d9d0be] rounded-lg text-sm text-[#18221e] focus:outline-hidden focus:border-[#b8763a]"
            />
          </div>

          <div className="space-y-1">
            <label className="font-semibold text-[#554d40]">Last Name *</label>
            <input
              required
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              className="w-full px-3 py-2 bg-[#fdfcf9] border border-[#d9d0be] rounded-lg text-sm text-[#18221e] focus:outline-hidden focus:border-[#b8763a]"
            />
          </div>

          <div className="space-y-1">
            <label className="font-semibold text-[#554d40]">Phone Number *</label>
            <input
              required
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+977 98XXXXXXXX"
              className="w-full px-3 py-2 bg-[#fdfcf9] border border-[#d9d0be] rounded-lg text-sm text-[#18221e] focus:outline-hidden focus:border-[#b8763a]"
            />
          </div>

          <div className="space-y-1">
            <label className="font-semibold text-[#554d40]">Email Address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="patient@example.com"
              className="w-full px-3 py-2 bg-[#fdfcf9] border border-[#d9d0be] rounded-lg text-sm text-[#18221e] focus:outline-hidden focus:border-[#b8763a]"
            />
          </div>

          <div className="space-y-1">
            <label className="font-semibold text-[#554d40]">Date of Birth</label>
            <input
              type="date"
              value={dateOfBirth}
              onChange={(e) => setDateOfBirth(e.target.value)}
              className="w-full px-3 py-2 bg-[#fdfcf9] border border-[#d9d0be] rounded-lg text-sm text-[#18221e] focus:outline-hidden focus:border-[#b8763a]"
            />
          </div>

          <div className="space-y-1">
            <label className="font-semibold text-[#554d40]">Gender</label>
            <select
              value={gender}
              onChange={(e) => setGender(e.target.value)}
              className="w-full px-3 py-2 bg-[#fdfcf9] border border-[#d9d0be] rounded-lg text-sm text-[#18221e] focus:outline-hidden focus:border-[#b8763a]"
            >
              <option>Female</option>
              <option>Male</option>
              <option>Non-binary</option>
              <option>Prefer not to say</option>
            </select>
          </div>

          <div className="space-y-1">
            <label className="font-semibold text-[#554d40]">Blood Group</label>
            <input
              value={bloodGroup}
              onChange={(e) => setBloodGroup(e.target.value)}
              placeholder="e.g. O+, A-, B+"
              className="w-full px-3 py-2 bg-[#fdfcf9] border border-[#d9d0be] rounded-lg text-sm text-[#18221e] focus:outline-hidden focus:border-[#b8763a]"
            />
          </div>

          <div className="space-y-1">
            <label className="font-semibold text-[#554d40]">Assigned Doctor</label>
            <select
              value={assignedTherapistId ?? ""}
              onChange={(e) =>
                setAssignedTherapistId(e.target.value ? Number(e.target.value) : null)
              }
              className="w-full px-3 py-2 bg-[#fdfcf9] border border-[#d9d0be] rounded-lg text-sm text-[#18221e] focus:outline-hidden focus:border-[#b8763a]"
            >
              <option value="">Unassigned</option>
              {therapists.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="space-y-1">
          <label className="font-semibold text-[#554d40]">Allergies (Medical Alert)</label>
          <input
            value={allergies}
            onChange={(e) => setAllergies(e.target.value)}
            placeholder="e.g. Latex, Penicillin, Codeine"
            className="w-full px-3 py-2 bg-[#fdfcf9] border border-[#d9d0be] rounded-lg text-sm text-[#18221e] focus:outline-hidden focus:border-[#b8763a]"
          />
        </div>

        <div className="space-y-1">
          <label className="font-semibold text-[#554d40]">Address</label>
          <input
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="e.g. Jhamsikhel-3, Lalitpur, Nepal"
            className="w-full px-3 py-2 bg-[#fdfcf9] border border-[#d9d0be] rounded-lg text-sm text-[#18221e] focus:outline-hidden focus:border-[#b8763a]"
          />
        </div>

        <div className="space-y-1">
          <label className="font-semibold text-[#554d40]">
            Clinical Notes / Diagnosis / Condition
          </label>
          <textarea
            rows={3}
            value={medicalNotes}
            onChange={(e) => setMedicalNotes(e.target.value)}
            placeholder="Primary pathology, surgery details, rehabilitation protocol..."
            className="w-full px-3 py-2 bg-[#fdfcf9] border border-[#d9d0be] rounded-lg text-sm text-[#18221e] focus:outline-hidden focus:border-[#b8763a]"
          />
        </div>

        <div className="space-y-1">
          <label className="font-semibold text-[#554d40]">Status</label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as PatientPayload["status"])}
            className="w-full px-3 py-2 bg-[#fdfcf9] border border-[#d9d0be] rounded-lg text-sm text-[#18221e] focus:outline-hidden focus:border-[#b8763a]"
          >
            <option>Active</option>
            <option>Completed</option>
            <option>On hold</option>
          </select>
        </div>

        {error && (
          <div className="p-3 bg-[#fbeaea] border border-[#f1c5c1] text-[#b5493b] rounded-lg">
            {error}
          </div>
        )}

        <div className="flex justify-end gap-2.5 pt-4 border-t border-[#eee7d8]">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-[#554d40] bg-[#f4ede1] hover:bg-[#eae1d0] rounded-xl transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={busy}
            className="px-5 py-2 text-xs font-semibold text-white bg-[#b8763a] hover:bg-[#a3652e] disabled:opacity-50 rounded-xl transition-colors shadow-xs"
          >
            {busy ? "Saving..." : "Save Patient"}
          </button>
        </div>
      </form>
    </Modal>
  );
}

// ----------------- SCHEDULE TAB -----------------
function ScheduleTab({
  appointments,
  patients,
  therapists,
  onReload,
}: {
  appointments: Appointment[];
  patients: Patient[];
  therapists: Therapist[];
  onReload: () => Promise<void>;
}) {
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [isBooking, setIsBooking] = useState(false);
  const [actionError, setActionError] = useState("");

  const dayAppointments = useMemo(() => {
    return appointments.filter(
      (a) => a.appointment_date === date && a.status !== "Cancelled"
    );
  }, [appointments, date]);

  const slots = useMemo(() => {
    return Array.from({ length: 16 }, (_, i) => {
      const h = 8 + Math.floor(i / 2);
      const m = i % 2 ? "30" : "00";
      return `${String(h).padStart(2, "0")}:${m}`;
    });
  }, []);

  const handleUpdateStatus = async (
    id: number,
    newStatus: Appointment["status"]
  ) => {
    try {
      await api.updateAppointment(id, { status: newStatus });
      await onReload();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Failed to update appointment");
    }
  };

  return (
    <div className="space-y-4">
      <div className="bg-white border border-[#ded5c2] rounded-2xl p-4 shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <CalendarIcon className="w-4 h-4 text-[#b8763a]" />
          <span className="text-xs font-semibold uppercase tracking-wider text-[#716a5d]">
            Schedule Date
          </span>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="px-3 py-1.5 bg-[#fdfcf9] border border-[#d9d0be] rounded-xl text-xs font-medium text-[#18221e] focus:outline-hidden focus:border-[#b8763a]"
          />
        </div>

        <button
          onClick={() => setIsBooking(true)}
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#b8763a] hover:bg-[#a3652e] text-white text-xs font-semibold rounded-xl shadow-xs transition-colors shrink-0"
        >
          <Plus className="w-4 h-4" />
          Book Appointment
        </button>
      </div>

      {actionError && (
        <div className="p-3 bg-[#fbeaea] border border-[#f1c5c1] text-[#b5493b] text-xs rounded-xl">
          {actionError}
        </div>
      )}

      {/* Calendar Grid */}
      <div className="bg-white border border-[#ded5c2] rounded-2xl shadow-xs overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse min-w-[780px]">
          <thead>
            <tr className="bg-[#fcfaf5] text-[#716a5d] border-b border-[#eee7d8]">
              <th className="py-3 px-4 font-mono font-semibold w-24">Time</th>
              {therapists.map((t) => (
                <th key={t.id} className="py-3 px-4 font-semibold">
                  <div className="text-sm font-serif text-[#18221e]">{t.name}</div>
                  <div className="text-[10px] text-[#857d6f] font-sans font-normal">
                    {t.specialty}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-[#f0e8da]">
            {slots.map((slot) => (
              <tr key={slot} className="hover:bg-[#faf7f0]">
                <td className="py-2.5 px-4 font-mono text-[#857d6f] text-xs border-r border-[#f0e8da]">
                  {slot}
                </td>
                {therapists.map((t) => {
                  const match = dayAppointments.find(
                    (a) => a.therapist_id === t.id && a.start_time === slot
                  );

                  return (
                    <td key={t.id} className="py-2 px-3 align-top border-r border-[#f0e8da] last:border-r-0">
                      {match ? (
                        <div className="p-2.5 bg-[#e1ebe3] border border-[#bed4c3] rounded-xl text-xs space-y-1">
                          <div className="font-bold text-[#18221e]">
                            {match.patient_name}
                          </div>
                          <div className="text-[10px] text-[#3b664e] flex items-center justify-between">
                            <span>{match.service || "Therapy"}</span>
                            <span className="font-mono">{match.end_time}</span>
                          </div>
                          <div className="pt-1 flex items-center gap-1.5 text-[10px]">
                            {match.status === "Booked" && (
                              <button
                                onClick={() => handleUpdateStatus(match.id, "Completed")}
                                className="px-1.5 py-0.5 bg-white border border-[#4f7c63] text-[#4f7c63] rounded font-semibold hover:bg-[#4f7c63] hover:text-white"
                              >
                                Mark Done
                              </button>
                            )}
                            <button
                              onClick={() => handleUpdateStatus(match.id, "Cancelled")}
                              className="px-1.5 py-0.5 text-[#b5493b] hover:underline"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="h-9 rounded-lg border border-dashed border-[#ded5c2] flex items-center justify-center text-[11px] text-[#b0a898] hover:border-[#b8763a] hover:text-[#b8763a] cursor-pointer transition-colors">
                          Open Slot
                        </div>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {isBooking && (
        <BookingModal
          defaultDate={date}
          patients={patients}
          therapists={therapists}
          onClose={() => setIsBooking(false)}
          onSave={async (payload) => {
            await api.createAppointment(payload);
            setIsBooking(false);
            await onReload();
          }}
        />
      )}
    </div>
  );
}

// ----------------- SCHEDULE BOOKING MODAL -----------------
function BookingModal({
  defaultDate,
  patients,
  therapists,
  onClose,
  onSave,
}: {
  defaultDate: string;
  patients: Patient[];
  therapists: Therapist[];
  onClose: () => void;
  onSave: (payload: AppointmentPayload) => Promise<void>;
}) {
  const [patientId, setPatientId] = useState<number>(patients[0]?.id ?? 0);
  const [therapistId, setTherapistId] = useState<number>(therapists[0]?.id ?? 0);
  const [date, setDate] = useState(defaultDate);
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("09:30");
  const [service, setService] = useState("Comprehensive Physical Therapy");
  const [paymentMethod, setPaymentMethod] = useState("Card");
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      await onSave({
        patient_id: patientId,
        therapist_id: therapistId,
        appointment_date: date,
        start_time: startTime,
        end_time: endTime,
        service,
        payment_method: paymentMethod,
        notes,
        status: "Booked",
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to book slot");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal title="Schedule Clinical Session" onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4 text-xs">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          <div className="space-y-1">
            <label className="font-semibold text-[#554d40]">Patient *</label>
            <select
              value={patientId}
              onChange={(e) => setPatientId(Number(e.target.value))}
              className="w-full px-3 py-2 bg-[#fdfcf9] border border-[#d9d0be] rounded-lg text-sm text-[#18221e] focus:outline-hidden"
            >
              {patients.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.phone})
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <label className="font-semibold text-[#554d40]">Doctor *</label>
            <select
              value={therapistId}
              onChange={(e) => setTherapistId(Number(e.target.value))}
              className="w-full px-3 py-2 bg-[#fdfcf9] border border-[#d9d0be] rounded-lg text-sm text-[#18221e] focus:outline-hidden"
            >
              {therapists.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <label className="font-semibold text-[#554d40]">Appointment Date *</label>
            <input
              type="date"
              required
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-3 py-2 bg-[#fdfcf9] border border-[#d9d0be] rounded-lg text-sm text-[#18221e] focus:outline-hidden"
            />
          </div>

          <div className="space-y-1">
            <label className="font-semibold text-[#554d40]">Treatment Service</label>
            <input
              value={service}
              onChange={(e) => setService(e.target.value)}
              className="w-full px-3 py-2 bg-[#fdfcf9] border border-[#d9d0be] rounded-lg text-sm text-[#18221e] focus:outline-hidden"
            />
          </div>

          <div className="space-y-1">
            <label className="font-semibold text-[#554d40]">Start Time *</label>
            <input
              type="time"
              required
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              className="w-full px-3 py-2 bg-[#fdfcf9] border border-[#d9d0be] rounded-lg text-sm text-[#18221e] focus:outline-hidden"
            />
          </div>

          <div className="space-y-1">
            <label className="font-semibold text-[#554d40]">End Time *</label>
            <input
              type="time"
              required
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              className="w-full px-3 py-2 bg-[#fdfcf9] border border-[#d9d0be] rounded-lg text-sm text-[#18221e] focus:outline-hidden"
            />
          </div>
        </div>

        <div className="space-y-1">
          <label className="font-semibold text-[#554d40]">Payment Method</label>
          <select
            value={paymentMethod}
            onChange={(e) => setPaymentMethod(e.target.value)}
            className="w-full px-3 py-2 bg-[#fdfcf9] border border-[#d9d0be] rounded-lg text-sm text-[#18221e] focus:outline-hidden"
          >
            <option>Card</option>
            <option>Cash</option>
            <option>Transfer</option>
          </select>
        </div>

        <div className="space-y-1">
          <label className="font-semibold text-[#554d40]">Clinical Notes</label>
          <input
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Protocol notes, ultrasound, manual therapy..."
            className="w-full px-3 py-2 bg-[#fdfcf9] border border-[#d9d0be] rounded-lg text-sm text-[#18221e] focus:outline-hidden"
          />
        </div>

        {error && (
          <div className="p-3 bg-[#fbeaea] border border-[#f1c5c1] text-[#b5493b] rounded-lg">
            {error}
          </div>
        )}

        <div className="flex justify-end gap-2.5 pt-4 border-t border-[#eee7d8]">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-[#554d40] bg-[#f4ede1] hover:bg-[#eae1d0] rounded-xl transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={busy}
            className="px-5 py-2 text-xs font-semibold text-white bg-[#b8763a] hover:bg-[#a3652e] disabled:opacity-50 rounded-xl transition-colors shadow-xs"
          >
            {busy ? "Booking..." : "Confirm Slot"}
          </button>
        </div>
      </form>
    </Modal>
  );
}

// ----------------- BILLING TAB -----------------
function BillingTab({
  invoices,
  patients,
  onReload,
}: {
  invoices: Invoice[];
  patients: Patient[];
  onReload: () => Promise<void>;
}) {
  const [filter, setFilter] = useState("");
  const [isAdding, setIsAdding] = useState(false);

  const filtered = useMemo(() => {
    return invoices.filter((i) => !filter || i.status === filter);
  }, [invoices, filter]);

  return (
    <div className="space-y-4">
      <div className="bg-white border border-[#ded5c2] rounded-2xl p-4 shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="px-3 py-2 bg-[#fdfcf9] border border-[#d9d0be] rounded-xl text-xs text-[#18221e] focus:outline-hidden max-w-xs"
        >
          <option value="">All Invoice Statuses</option>
          <option>Paid</option>
          <option>Due</option>
          <option>Void</option>
        </select>

        <button
          onClick={() => setIsAdding(true)}
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#b8763a] hover:bg-[#a3652e] text-white text-xs font-semibold rounded-xl shadow-xs transition-colors shrink-0"
        >
          <Plus className="w-4 h-4" />
          Create Invoice
        </button>
      </div>

      <div className="bg-white border border-[#ded5c2] rounded-2xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-[#fcfaf5] text-[#716a5d] uppercase tracking-wider text-[10px] border-b border-[#eee7d8]">
                <th className="py-3 px-4 font-semibold">Patient</th>
                <th className="py-3 px-4 font-semibold">Service</th>
                <th className="py-3 px-4 font-semibold">Date</th>
                <th className="py-3 px-4 font-semibold">Amount</th>
                <th className="py-3 px-4 font-semibold">Status</th>
                <th className="py-3 px-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#f0e8da]">
              {filtered.map((inv) => (
                <tr key={inv.id} className="hover:bg-[#faf7f0]">
                  <td className="py-3 px-4 font-bold text-[#18221e]">
                    {inv.patient_name}
                  </td>
                  <td className="py-3 px-4 text-[#554d40]">{inv.service}</td>
                  <td className="py-3 px-4 font-mono text-[#716a5d]">{inv.invoice_date}</td>
                  <td className="py-3 px-4 font-mono font-bold text-[#18221e]">
                    {money(inv.amount - inv.discount)}
                  </td>
                  <td className="py-3 px-4">
                    <StatusBadge text={inv.status} />
                  </td>
                  <td className="py-3 px-4 text-right">
                    <button
                      type="button"
                      title="Download invoice PDF"
                      aria-label={`Download invoice ${inv.invoice_number ?? inv.id} as PDF`}
                      onClick={() => downloadInvoicePdf(inv)}
                      className="inline-flex items-center justify-center p-1.5 mr-2 text-[#554d40] hover:text-[#b8763a] hover:bg-[#fbf4e8] rounded-lg transition-colors"
                    >
                      <Download className="w-4 h-4" />
                    </button>
                    {inv.status === "Due" && (
                      <button
                        onClick={async () => {
                          await api.updateInvoice(inv.id, {
                            patient_id: inv.patient_id,
                            service: inv.service,
                            invoice_date: inv.invoice_date,
                            amount: inv.amount,
                            discount: inv.discount,
                            status: "Paid",
                          });
                          await onReload();
                        }}
                        className="px-2.5 py-1 bg-[#e1ebe3] hover:bg-[#bed4c3] text-[#2c533c] text-[11px] font-semibold rounded-lg transition-colors"
                      >
                        Mark as Paid
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <div className="p-8 text-center text-xs text-[#716a5d]">
              No invoices match this filter criteria.
            </div>
          )}
        </div>
      </div>

      {isAdding && (
        <InvoiceFormModal
          patients={patients}
          onClose={() => setIsAdding(false)}
          onSave={async (payload) => {
            await api.createInvoice(payload);
            setIsAdding(false);
            await onReload();
          }}
        />
      )}
    </div>
  );
}

function InvoiceFormModal({
  patients,
  onClose,
  onSave,
}: {
  patients: Patient[];
  onClose: () => void;
  onSave: (payload: InvoicePayload) => Promise<void>;
}) {
  const [patientId, setPatientId] = useState<number>(patients[0]?.id ?? 0);
  const [service, setService] = useState("Rehabilitation Treatment Session");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [amount, setAmount] = useState(1500);
  const [discount, setDiscount] = useState(0);
  const [status, setStatus] = useState<InvoicePayload["status"]>("Due");
  const [paymentMethod, setPaymentMethod] = useState("Fonepay / QR");
  const [busy, setBusy] = useState(false);

  return (
    <Modal title="Generate Patient Invoice" onClose={onClose}>
      <form
        onSubmit={async (e) => {
          e.preventDefault();
          setBusy(true);
          await onSave({
            patient_id: patientId,
            service,
            invoice_date: date,
            amount: Number(amount),
            discount: Number(discount),
            status,
            payment_method: paymentMethod,
          });
          setBusy(false);
        }}
        className="space-y-4 text-xs"
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          <div className="space-y-1">
            <label className="font-semibold text-[#554d40]">Patient</label>
            <select
              value={patientId}
              onChange={(e) => setPatientId(Number(e.target.value))}
              className="w-full px-3 py-2 bg-[#fdfcf9] border border-[#d9d0be] rounded-lg text-sm text-[#18221e]"
            >
              {patients.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <label className="font-semibold text-[#554d40]">Invoice Date</label>
            <input
              type="date"
              required
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-3 py-2 bg-[#fdfcf9] border border-[#d9d0be] rounded-lg text-sm text-[#18221e]"
            />
          </div>

          <div className="space-y-1 sm:col-span-2">
            <label className="font-semibold text-[#554d40]">Clinical Service Description</label>
            <input
              required
              value={service}
              onChange={(e) => setService(e.target.value)}
              className="w-full px-3 py-2 bg-[#fdfcf9] border border-[#d9d0be] rounded-lg text-sm text-[#18221e]"
            />
          </div>

          <div className="space-y-1">
            <label className="font-semibold text-[#554d40]">Amount (Rs. / NPR)</label>
            <input
              type="number"
              min="0"
              required
              value={amount}
              onChange={(e) => setAmount(Number(e.target.value))}
              className="w-full px-3 py-2 bg-[#fdfcf9] border border-[#d9d0be] rounded-lg text-sm text-[#18221e]"
            />
          </div>

          <div className="space-y-1">
            <label className="font-semibold text-[#554d40]">Discount (Rs.)</label>
            <input
              type="number"
              min="0"
              value={discount}
              onChange={(e) => setDiscount(Number(e.target.value))}
              className="w-full px-3 py-2 bg-[#fdfcf9] border border-[#d9d0be] rounded-lg text-sm text-[#18221e]"
            />
          </div>

          <div className="space-y-1">
            <label className="font-semibold text-[#554d40]">Invoice Status</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as InvoicePayload["status"])}
              className="w-full px-3 py-2 bg-[#fdfcf9] border border-[#d9d0be] rounded-lg text-sm text-[#18221e]"
            >
              <option>Due</option>
              <option>Paid</option>
              <option>Void</option>
            </select>
          </div>

          <div className="space-y-1">
            <label className="font-semibold text-[#554d40]">Payment Method (Nepal)</label>
            <select
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
              className="w-full px-3 py-2 bg-[#fdfcf9] border border-[#d9d0be] rounded-lg text-sm text-[#18221e]"
            >
              <option>Fonepay / QR</option>
              <option>eSewa</option>
              <option>Khalti</option>
              <option>Cash</option>
              <option>Card (SCT / Visa)</option>
            </select>
          </div>
        </div>

        <div className="flex justify-end gap-2.5 pt-4 border-t border-[#eee7d8]">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-[#554d40] bg-[#f4ede1] rounded-xl"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={busy}
            className="px-5 py-2 text-xs font-semibold text-white bg-[#b8763a] rounded-xl"
          >
            {busy ? "Saving..." : "Create Invoice"}
          </button>
        </div>
      </form>
    </Modal>
  );
}

// ----------------- THERAPISTS TAB -----------------
function TherapistsTab({
  therapists,
  role,
  onReload,
}: {
  therapists: Therapist[];
  role: Role;
  onReload: () => Promise<void>;
}) {
  const [isAdding, setIsAdding] = useState(false);

  return (
    <div className="space-y-4">
      <div className="bg-white border border-[#ded5c2] rounded-2xl p-4 shadow-xs flex items-center justify-between">
        <div>
          <h3 className="text-sm font-serif font-bold text-[#18221e]">
            Doctor & Therapist Team Directory
          </h3>
          <p className="text-xs text-[#716a5d]">
            {therapists.length} registered clinical providers
          </p>
        </div>

        {role === "admin" && (
          <button
            onClick={() => setIsAdding(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#b8763a] hover:bg-[#a3652e] text-white text-xs font-semibold rounded-xl shadow-xs transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Doctor
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {therapists.map((t) => (
          <div
            key={t.id}
            className="bg-white border border-[#ded5c2] rounded-2xl p-5 shadow-xs space-y-3"
          >
            <div className="flex items-center gap-3">
              {t.image ? (
                <div className="relative w-12 h-12 rounded-full overflow-hidden border border-[#ded5c2]">
                  <Image
                    src={t.image}
                    alt={t.name}
                    fill
                    sizes="48px"
                    className="object-cover"
                    referrerPolicy="no-referrer"
                  />
                </div>
              ) : (
                <div className="w-12 h-12 rounded-full bg-[#132420] text-[#f0dfc7] font-serif font-bold text-sm flex items-center justify-center">
                  {t.name
                    .split(" ")
                    .map((p) => p[0])
                    .slice(0, 2)
                    .join("")}
                </div>
              )}
              <div className="min-w-0">
                <h4 className="text-sm font-bold text-[#18221e] truncate">{t.name}</h4>
                <p className="text-[11px] text-[#b8763a] truncate">{t.specialty}</p>
              </div>
            </div>

            <div className="pt-2 border-t border-[#f0e8da] space-y-1 text-xs text-[#554d40]">
              <div className="flex justify-between">
                <span className="text-[#857d6f]">Days:</span>
                <span className="font-medium text-[#18221e]">{t.working_days}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#857d6f]">Hours:</span>
                <span className="font-mono text-[#18221e]">
                  {t.start_time} - {t.end_time}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#857d6f]">Slot:</span>
                <span className="font-mono text-[#18221e]">{t.slot_duration} min</span>
              </div>
            </div>

            <div className="pt-2 border-t border-[#f0e8da] flex items-center justify-between">
              <StatusBadge text={t.is_active ? "Active" : "On hold"} />
            </div>
          </div>
        ))}
      </div>

      {isAdding && (
        <TherapistFormModal
          onClose={() => setIsAdding(false)}
          onSave={async (payload) => {
            await api.createTherapist(payload);
            setIsAdding(false);
            await onReload();
          }}
        />
      )}
    </div>
  );
}

function TherapistFormModal({
  onClose,
  onSave,
}: {
  onClose: () => void;
  onSave: (payload: TherapistPayload) => Promise<void>;
}) {
  const [name, setName] = useState("");
  const [specialty, setSpecialty] = useState("");
  const [workingDays, setWorkingDays] = useState("Mon,Tue,Wed,Thu,Fri");
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("17:00");
  const [slotDuration, setSlotDuration] = useState(30);
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState(false);

  return (
    <Modal title="Add Therapist to Medical Staff" onClose={onClose}>
      <form
        onSubmit={async (e) => {
          e.preventDefault();
          setBusy(true);
          await onSave({
            name,
            specialty,
            working_days: workingDays,
            start_time: startTime,
            end_time: endTime,
            slot_duration: Number(slotDuration),
            is_active: true,
            notes,
          });
          setBusy(false);
        }}
        className="space-y-4 text-xs"
      >
        <div className="space-y-1">
          <label className="font-semibold text-[#554d40]">Doctor Full Name *</label>
          <input
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Dr. Jane Doe, DPT"
            className="w-full px-3 py-2 bg-[#fdfcf9] border border-[#d9d0be] rounded-lg text-sm text-[#18221e]"
          />
        </div>

        <div className="space-y-1">
          <label className="font-semibold text-[#554d40]">Clinical Specialty *</label>
          <input
            required
            value={specialty}
            onChange={(e) => setSpecialty(e.target.value)}
            placeholder="e.g. Sports Injury & Rotator Cuff"
            className="w-full px-3 py-2 bg-[#fdfcf9] border border-[#d9d0be] rounded-lg text-sm text-[#18221e]"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="space-y-1 sm:col-span-3">
            <label className="font-semibold text-[#554d40]">Working Days *</label>
            <input
              required
              value={workingDays}
              onChange={(e) => setWorkingDays(e.target.value)}
              placeholder="Mon,Tue,Wed,Thu,Fri"
              className="w-full px-3 py-2 bg-[#fdfcf9] border border-[#d9d0be] rounded-lg text-sm text-[#18221e]"
            />
          </div>

          <div className="space-y-1">
            <label className="font-semibold text-[#554d40]">Start Time *</label>
            <input
              type="time"
              required
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              className="w-full px-3 py-2 bg-[#fdfcf9] border border-[#d9d0be] rounded-lg text-sm text-[#18221e]"
            />
          </div>

          <div className="space-y-1">
            <label className="font-semibold text-[#554d40]">End Time *</label>
            <input
              type="time"
              required
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              className="w-full px-3 py-2 bg-[#fdfcf9] border border-[#d9d0be] rounded-lg text-sm text-[#18221e]"
            />
          </div>

          <div className="space-y-1">
            <label className="font-semibold text-[#554d40]">Slot (Mins) *</label>
            <input
              type="number"
              min="10"
              required
              value={slotDuration}
              onChange={(e) => setSlotDuration(Number(e.target.value))}
              className="w-full px-3 py-2 bg-[#fdfcf9] border border-[#d9d0be] rounded-lg text-sm text-[#18221e]"
            />
          </div>

          <div className="space-y-1 sm:col-span-3">
            <label className="font-semibold text-[#554d40]">Clinical Background & Specialization Notes</label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Certifications, specific sports or orthopedic focus..."
              className="w-full px-3 py-2 bg-[#fdfcf9] border border-[#d9d0be] rounded-lg text-sm text-[#18221e]"
            />
          </div>
        </div>

        <div className="flex justify-end gap-2.5 pt-4 border-t border-[#eee7d8]">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-[#554d40] bg-[#f4ede1] rounded-xl"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={busy}
            className="px-5 py-2 text-xs font-semibold text-white bg-[#b8763a] rounded-xl"
          >
            {busy ? "Saving..." : "Add Doctor"}
          </button>
        </div>
      </form>
    </Modal>
  );
}

// ----------------- SERVICES MANAGEMENT TAB (ADMIN ONLY) -----------------
function ServicesTab({
  role,
  onReload,
}: {
  role: Role;
  onReload: () => Promise<void>;
}) {
  const [services, setServices] = useState<ClinicService[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [isAdding, setIsAdding] = useState(false);
  const [editingService, setEditingService] = useState<ClinicService | null>(null);
  const [actionBusyId, setActionBusyId] = useState<number | null>(null);

  const fetchServices = async () => {
    try {
      const data = await api.services({ include_inactive: true });
      setServices(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load clinic services");
    }
  };

  useEffect(() => {
    let active = true;
    api.services({ include_inactive: true })
      .then((data) => {
        if (!active) return;
        setServices(data);
        setLoading(false);
      })
      .catch((err) => {
        if (!active) return;
        setError(err instanceof Error ? err.message : "Failed to load clinic services");
        setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const categories = useMemo(() => {
    const set = new Set<string>();
    services.forEach((s) => {
      if (s.category) set.add(s.category);
    });
    return ["All", ...Array.from(set)];
  }, [services]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return services.filter((s) => {
      const matchesSearch =
        !q ||
        s.name.toLowerCase().includes(q) ||
        s.category.toLowerCase().includes(q) ||
        (s.indications && s.indications.toLowerCase().includes(q)) ||
        (s.description && s.description.toLowerCase().includes(q));
      const matchesCategory = categoryFilter === "All" || s.category === categoryFilter;
      return matchesSearch && matchesCategory;
    });
  }, [services, search, categoryFilter]);

  const handleToggleActive = async (s: ClinicService) => {
    setActionBusyId(s.id);
    try {
      await api.updateService(s.id, { is_active: !s.is_active });
      await fetchServices();
      await onReload();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update service status");
    } finally {
      setActionBusyId(null);
    }
  };

  const handleDelete = async (s: ClinicService) => {
    if (!confirm(`Are you sure you want to remove the service "${s.name}"?`)) return;
    setActionBusyId(s.id);
    try {
      await api.deleteService(s.id);
      await fetchServices();
      await onReload();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete service");
    } finally {
      setActionBusyId(null);
    }
  };

  return (
    <div className="space-y-4">
      {/* Top Banner / Toolbar */}
      <div className="bg-white border border-[#ded5c2] rounded-2xl p-4 shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-serif font-bold text-[#18221e] flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-[#b8763a]" />
            Clinical Services & Treatment Directory
          </h3>
          <p className="text-xs text-[#716a5d] mt-0.5">
            Configure therapies, consultation session fees (NPR), and booking categories for the patient portal.
          </p>
        </div>

        {role === "admin" && (
          <button
            onClick={() => setIsAdding(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#b8763a] hover:bg-[#a3652e] text-white text-xs font-semibold rounded-xl shadow-xs transition-colors shrink-0"
          >
            <Plus className="w-4 h-4" />
            Add New Service
          </button>
        )}
      </div>

      {error && (
        <div className="p-3 bg-[#fbeaea] border border-[#f1c5c1] text-[#b5493b] text-xs rounded-xl flex items-center justify-between">
          <span>{error}</span>
          <button onClick={fetchServices} className="underline font-bold">
            Retry
          </button>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white border border-[#ded5c2] rounded-2xl p-4 shadow-xs flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        <div className="relative flex-1 max-w-sm">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#857d6f]" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search service by name, condition, or tag..."
            className="w-full pl-9 pr-3 py-1.5 bg-[#fdfcf9] border border-[#d9d0be] rounded-xl text-xs text-[#18221e] focus:outline-hidden focus:border-[#b8763a]"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
          <span className="text-[11px] font-semibold text-[#857d6f] shrink-0 uppercase tracking-wider">
            Category:
          </span>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-3 py-1.5 bg-[#fdfcf9] border border-[#d9d0be] rounded-xl text-xs font-medium text-[#18221e] focus:outline-hidden focus:border-[#b8763a]"
          >
            {categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Services Table */}
      <div className="bg-white border border-[#ded5c2] rounded-2xl overflow-hidden shadow-xs">
        {loading ? (
          <div className="p-8 text-center text-xs text-[#716a5d]">Loading clinical services...</div>
        ) : filtered.length === 0 ? (
          <div className="p-8 text-center text-xs text-[#716a5d]">
            No clinical services matched your search criteria.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#faf7f0] border-b border-[#ebdcc4] text-[#716a5d] uppercase tracking-wider text-[10px] font-bold">
                <tr>
                  <th className="py-3 px-4">Service & Clinical Focus</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Duration</th>
                  <th className="py-3 px-4">Fee (NPR)</th>
                  <th className="py-3 px-4">Indications</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#eee7d8]">
                {filtered.map((s) => (
                  <tr key={s.id} className="hover:bg-[#faf7f0]/60 transition-colors">
                    <td className="py-3 px-4 max-w-xs">
                      <div className="font-semibold text-[#18221e]">{s.name}</div>
                      {s.description && (
                        <div className="text-[11px] text-[#716a5d] line-clamp-1 mt-0.5">
                          {s.description}
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <span className="inline-block px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-[#f5ede1] text-[#5c3a17] border border-[#e4d8c2]">
                        {s.category}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono text-[#554d40]">{s.duration}</td>
                    <td className="py-3 px-4 font-mono font-bold text-[#b8763a]">
                      {s.price_display || money(s.price)}
                    </td>
                    <td className="py-3 px-4 max-w-xs text-[#554d40]">
                      <span className="line-clamp-1">{s.indications || "General musculoskeletal"}</span>
                    </td>
                    <td className="py-3 px-4">
                      <StatusBadge text={s.is_active ? "Active" : "On hold"} />
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => setEditingService(s)}
                          className="p-1.5 text-[#716a5d] hover:text-[#18221e] hover:bg-[#f4ede1] rounded-lg transition-colors"
                          title="Edit Service"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          disabled={actionBusyId === s.id}
                          onClick={() => handleToggleActive(s)}
                          className={`px-2 py-1 text-[10px] font-semibold rounded-md border transition-colors ${
                            s.is_active
                              ? "text-[#b5493b] border-[#f1c5c1] hover:bg-[#fbeaea]"
                              : "text-[#3b664e] border-[#bed4c3] hover:bg-[#e1ebe3]"
                          }`}
                        >
                          {s.is_active ? "Deactivate" : "Activate"}
                        </button>
                        {role === "admin" && (
                          <button
                            disabled={actionBusyId === s.id}
                            onClick={() => handleDelete(s)}
                            className="p-1.5 text-[#b5493b] hover:bg-[#fbeaea] rounded-lg transition-colors"
                            title="Delete Service"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Modal */}
      {isAdding && (
        <ServiceFormModal
          onClose={() => setIsAdding(false)}
          onSave={async (payload) => {
            await api.createService(payload);
            setIsAdding(false);
            await fetchServices();
            await onReload();
          }}
        />
      )}

      {/* Edit Modal */}
      {editingService && (
        <ServiceFormModal
          initial={editingService}
          onClose={() => setEditingService(null)}
          onSave={async (payload) => {
            await api.updateService(editingService.id, payload);
            setEditingService(null);
            await fetchServices();
            await onReload();
          }}
        />
      )}
    </div>
  );
}

function ServiceFormModal({
  initial,
  onClose,
  onSave,
}: {
  initial?: ClinicService;
  onClose: () => void;
  onSave: (payload: ServicePayload) => Promise<void>;
}) {
  const [name, setName] = useState(initial?.name ?? "");
  const [category, setCategory] = useState(initial?.category ?? "Sports Rehab");
  const [duration, setDuration] = useState(initial?.duration ?? "45 min");
  const [price, setPrice] = useState(initial?.price ? String(initial.price) : "1500");
  const [indications, setIndications] = useState(initial?.indications ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [isActive, setIsActive] = useState(initial?.is_active ?? true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      await onSave({
        name: name.trim(),
        category: category.trim(),
        duration: duration.trim(),
        price: Number(price),
        indications: indications.trim(),
        description: description.trim(),
        is_active: isActive,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save clinical service");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal title={initial ? "Edit Clinical Service" : "Register New Clinical Service"} onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4 text-xs">
        <div className="space-y-1">
          <label className="font-semibold text-[#554d40]">Service Name *</label>
          <input
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Sports Injury & ACL Rehabilitation"
            className="w-full px-3 py-2 bg-[#fdfcf9] border border-[#d9d0be] rounded-lg text-sm text-[#18221e] focus:outline-hidden focus:border-[#b8763a]"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="space-y-1">
            <label className="font-semibold text-[#554d40]">Category *</label>
            <input
              required
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              placeholder="e.g. Sports Rehab, Spine & Joint"
              className="w-full px-3 py-2 bg-[#fdfcf9] border border-[#d9d0be] rounded-lg text-sm text-[#18221e] focus:outline-hidden focus:border-[#b8763a]"
            />
          </div>

          <div className="space-y-1">
            <label className="font-semibold text-[#554d40]">Duration *</label>
            <input
              required
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
              placeholder="e.g. 45 min, 60 min"
              className="w-full px-3 py-2 bg-[#fdfcf9] border border-[#d9d0be] rounded-lg text-sm text-[#18221e] focus:outline-hidden focus:border-[#b8763a]"
            />
          </div>

          <div className="space-y-1">
            <label className="font-semibold text-[#554d40]">Fee in NPR (Rs.) *</label>
            <input
              type="number"
              min="0"
              required
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="1500"
              className="w-full px-3 py-2 bg-[#fdfcf9] border border-[#d9d0be] rounded-lg text-sm text-[#18221e] focus:outline-hidden focus:border-[#b8763a]"
            />
          </div>
        </div>

        <div className="space-y-1">
          <label className="font-semibold text-[#554d40]">
            Clinical Indications / Symptoms Addressed
          </label>
          <input
            value={indications}
            onChange={(e) => setIndications(e.target.value)}
            placeholder="e.g. ACL tear, Meniscus sprain, Ankle instability"
            className="w-full px-3 py-2 bg-[#fdfcf9] border border-[#d9d0be] rounded-lg text-sm text-[#18221e] focus:outline-hidden focus:border-[#b8763a]"
          />
        </div>

        <div className="space-y-1">
          <label className="font-semibold text-[#554d40]">Clinical Description & Treatment Protocol</label>
          <textarea
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Targeted protocol with kinetic evaluation, manual mobilization, neuromuscular stim..."
            className="w-full px-3 py-2 bg-[#fdfcf9] border border-[#d9d0be] rounded-lg text-sm text-[#18221e] focus:outline-hidden focus:border-[#b8763a]"
          />
        </div>

        <div className="flex items-center gap-2 pt-1">
          <input
            type="checkbox"
            id="service-active"
            checked={isActive}
            onChange={(e) => setIsActive(e.target.checked)}
            className="w-4 h-4 rounded text-[#b8763a] focus:ring-0"
          />
          <label htmlFor="service-active" className="text-xs font-semibold text-[#18221e] cursor-pointer">
            Service Active and available in Online Patient Booking
          </label>
        </div>

        {error && (
          <div className="p-3 bg-[#fbeaea] border border-[#f1c5c1] text-[#b5493b] text-xs rounded-lg">
            {error}
          </div>
        )}

        <div className="flex justify-end gap-2.5 pt-4 border-t border-[#eee7d8]">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-[#554d40] bg-[#f4ede1] hover:bg-[#eae1d0] rounded-xl transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={busy}
            className="px-5 py-2 text-xs font-semibold text-white bg-[#b8763a] hover:bg-[#a3652e] disabled:opacity-50 rounded-xl transition-colors shadow-xs"
          >
            {busy ? "Saving..." : initial ? "Update Service" : "Add Service"}
          </button>
        </div>
      </form>
    </Modal>
  );
}

// ----------------- USER MANAGEMENT TAB (ADMIN ONLY) -----------------
function UsersTab({
  role,
  currentUser,
  onReload,
}: {
  role: Role;
  currentUser: User;
  onReload: () => Promise<void>;
}) {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("All");
  const [isAdding, setIsAdding] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [actionBusyId, setActionBusyId] = useState<number | null>(null);

  const fetchUsers = async () => {
    try {
      const data = await api.users();
      setUsers(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load clinic personnel accounts");
    }
  };

  useEffect(() => {
    let active = true;
    api.users()
      .then((data) => {
        if (!active) return;
        setUsers(data);
        setLoading(false);
      })
      .catch((err) => {
        if (!active) return;
        setError(err instanceof Error ? err.message : "Failed to load clinic personnel accounts");
        setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return users.filter((u) => {
      const matchesSearch =
        !q ||
        u.full_name.toLowerCase().includes(q) ||
        u.username.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        (u.phone && u.phone.toLowerCase().includes(q));
      const matchesRole = roleFilter === "All" || u.role === roleFilter;
      return matchesSearch && matchesRole;
    });
  }, [users, search, roleFilter]);

  const handleToggleActive = async (u: User) => {
    if (u.id === 1) {
      alert("Cannot deactivate the primary root administrator account.");
      return;
    }
    setActionBusyId(u.id);
    try {
      await api.updateUser(u.id, { is_active: !u.is_active });
      await fetchUsers();
      await onReload();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update user status");
    } finally {
      setActionBusyId(null);
    }
  };

  const handleDelete = async (u: User) => {
    if (u.id === 1) {
      alert("Cannot delete the primary root administrator account.");
      return;
    }
    if (u.id === currentUser.id) {
      alert("You cannot delete your own active administrator account.");
      return;
    }
    if (!confirm(`Are you sure you want to delete user account "${u.full_name}" (@${u.username})?`)) {
      return;
    }
    setActionBusyId(u.id);
    try {
      await api.deleteUser(u.id);
      await fetchUsers();
      await onReload();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete user");
    } finally {
      setActionBusyId(null);
    }
  };

  return (
    <div className="space-y-4">
      {/* Top Banner / Toolbar */}
      <div className="bg-white border border-[#ded5c2] rounded-2xl p-4 shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-serif font-bold text-[#18221e] flex items-center gap-2">
            <UserCog className="w-4 h-4 text-[#b8763a]" />
            User & Staff Access Management
          </h3>
          <p className="text-xs text-[#716a5d] mt-0.5">
            Administer staff roles, credentials, and clinic access permissions in Nepal.
          </p>
        </div>

        {role === "admin" && (
          <button
            onClick={() => setIsAdding(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#b8763a] hover:bg-[#a3652e] text-white text-xs font-semibold rounded-xl shadow-xs transition-colors shrink-0"
          >
            <Plus className="w-4 h-4" />
            Add Clinic User
          </button>
        )}
      </div>

      {error && (
        <div className="p-3 bg-[#fbeaea] border border-[#f1c5c1] text-[#b5493b] text-xs rounded-xl flex items-center justify-between">
          <span>{error}</span>
          <button onClick={fetchUsers} className="underline font-bold">
            Retry
          </button>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white border border-[#ded5c2] rounded-2xl p-4 shadow-xs flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        <div className="relative flex-1 max-w-sm">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#857d6f]" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search user by name, username, email, or phone..."
            className="w-full pl-9 pr-3 py-1.5 bg-[#fdfcf9] border border-[#d9d0be] rounded-xl text-xs text-[#18221e] focus:outline-hidden focus:border-[#b8763a]"
          />
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[11px] font-semibold text-[#857d6f] uppercase tracking-wider">
            Role:
          </span>
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="px-3 py-1.5 bg-[#fdfcf9] border border-[#d9d0be] rounded-xl text-xs font-medium text-[#18221e] focus:outline-hidden focus:border-[#b8763a]"
          >
            <option value="All">All Roles</option>
            <option value="admin">Administrator</option>
            <option value="staff">Clinic Staff</option>
          </select>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white border border-[#ded5c2] rounded-2xl overflow-hidden shadow-xs">
        {loading ? (
          <div className="p-8 text-center text-xs text-[#716a5d]">Loading clinic users...</div>
        ) : filtered.length === 0 ? (
          <div className="p-8 text-center text-xs text-[#716a5d]">
            No user accounts found matching your search.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#faf7f0] border-b border-[#ebdcc4] text-[#716a5d] uppercase tracking-wider text-[10px] font-bold">
                <tr>
                  <th className="py-3 px-4">User Profile</th>
                  <th className="py-3 px-4">Username</th>
                  <th className="py-3 px-4">Contact (Nepal)</th>
                  <th className="py-3 px-4">Role</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Created Date</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#eee7d8]">
                {filtered.map((u) => {
                  const initials = u.full_name
                    .split(" ")
                    .map((n) => n[0])
                    .join("")
                    .slice(0, 2)
                    .toUpperCase();

                  const isRootAdmin = u.id === 1;
                  const isCurrent = u.id === currentUser.id;

                  return (
                    <tr key={u.id} className="hover:bg-[#faf7f0]/60 transition-colors">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-[#132420] text-[#f0dfc7] font-bold text-xs flex items-center justify-center shrink-0">
                            {initials}
                          </div>
                          <div>
                            <div className="font-semibold text-[#18221e] flex items-center gap-1.5">
                              {u.full_name}
                              {isCurrent && (
                                <span className="text-[10px] font-mono text-[#b8763a] font-normal">
                                  (You)
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-[#716a5d]">{u.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4 font-mono font-medium text-[#554d40]">
                        @{u.username}
                      </td>
                      <td className="py-3 px-4">
                        <div className="text-[#18221e] font-mono text-[11px]">
                          {u.phone || "—"}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        {u.role === "admin" ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[#f0dfc7] text-[#5c3a17] border border-[#d8c3a5]">
                            <ShieldCheck className="w-3 h-3 text-[#b8763a]" />
                            Administrator
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-[#e7ebee] text-[#4a5568] border border-[#cbd5e1]">
                            <UserCheck className="w-3 h-3 text-[#4a5568]" />
                            Clinic Staff
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <StatusBadge text={u.is_active ? "Active" : "Inactive"} />
                      </td>
                      <td className="py-3 px-4 font-mono text-[#716a5d] text-[11px]">
                        {u.created_at || "—"}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => setEditingUser(u)}
                            className="p-1.5 text-[#716a5d] hover:text-[#18221e] hover:bg-[#f4ede1] rounded-lg transition-colors"
                            title="Edit User"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          {!isRootAdmin && (
                            <button
                              disabled={actionBusyId === u.id}
                              onClick={() => handleToggleActive(u)}
                              className={`px-2 py-1 text-[10px] font-semibold rounded-md border transition-colors ${
                                u.is_active
                                  ? "text-[#b5493b] border-[#f1c5c1] hover:bg-[#fbeaea]"
                                  : "text-[#3b664e] border-[#bed4c3] hover:bg-[#e1ebe3]"
                              }`}
                            >
                              {u.is_active ? "Deactivate" : "Activate"}
                            </button>
                          )}
                          {!isRootAdmin && !isCurrent && (
                            <button
                              disabled={actionBusyId === u.id}
                              onClick={() => handleDelete(u)}
                              className="p-1.5 text-[#b5493b] hover:bg-[#fbeaea] rounded-lg transition-colors"
                              title="Delete User"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add User Modal */}
      {isAdding && (
        <UserFormModal
          onClose={() => setIsAdding(false)}
          onSave={async (payload) => {
            await api.createUser(payload);
            setIsAdding(false);
            await fetchUsers();
            await onReload();
          }}
        />
      )}

      {/* Edit User Modal */}
      {editingUser && (
        <UserFormModal
          initial={editingUser}
          onClose={() => setEditingUser(null)}
          onSave={async (payload) => {
            await api.updateUser(editingUser.id, payload);
            setEditingUser(null);
            await fetchUsers();
            await onReload();
          }}
        />
      )}
    </div>
  );
}

function UserFormModal({
  initial,
  onClose,
  onSave,
}: {
  initial?: User;
  onClose: () => void;
  onSave: (payload: UserPayload) => Promise<void>;
}) {
  const [fullName, setFullName] = useState(initial?.full_name ?? "");
  const [username, setUsername] = useState(initial?.username ?? "");
  const [email, setEmail] = useState(initial?.email ?? "");
  const [phone, setPhone] = useState(initial?.phone ?? "+977 98");
  const [role, setRole] = useState<Role>(initial?.role ?? "staff");
  const [password, setPassword] = useState("");
  const [isActive, setIsActive] = useState(initial?.is_active ?? true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError("");

    try {
      const payload: UserPayload = {
        full_name: fullName.trim(),
        username: username.trim().toLowerCase(),
        email: email.trim().toLowerCase(),
        phone: phone.trim() || null,
        role,
        is_active: isActive,
      };

      if (password.trim()) {
        payload.password = password.trim();
      } else if (!initial) {
        payload.password = "welcome123";
      }

      await onSave(payload);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save user account");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal title={initial ? "Edit Staff User Account" : "Register New Clinic User"} onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4 text-xs">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          <div className="space-y-1 sm:col-span-2">
            <label className="font-semibold text-[#554d40]">Full Name *</label>
            <input
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="e.g. Dr. Ayush Shrestha, PT"
              className="w-full px-3 py-2 bg-[#fdfcf9] border border-[#d9d0be] rounded-lg text-sm text-[#18221e] focus:outline-hidden focus:border-[#b8763a]"
            />
          </div>

          <div className="space-y-1">
            <label className="font-semibold text-[#554d40]">Username *</label>
            <input
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="e.g. ashrestha"
              className="w-full px-3 py-2 bg-[#fdfcf9] border border-[#d9d0be] rounded-lg text-sm text-[#18221e] focus:outline-hidden focus:border-[#b8763a]"
            />
          </div>

          <div className="space-y-1">
            <label className="font-semibold text-[#554d40]">Email Address *</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="ayush@physiodesk.np"
              className="w-full px-3 py-2 bg-[#fdfcf9] border border-[#d9d0be] rounded-lg text-sm text-[#18221e] focus:outline-hidden focus:border-[#b8763a]"
            />
          </div>

          <div className="space-y-1">
            <label className="font-semibold text-[#554d40]">Mobile Number (Nepal)</label>
            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+977 98XXXXXXXX"
              className="w-full px-3 py-2 bg-[#fdfcf9] border border-[#d9d0be] rounded-lg text-sm text-[#18221e] focus:outline-hidden focus:border-[#b8763a]"
            />
          </div>

          <div className="space-y-1">
            <label className="font-semibold text-[#554d40]">System Role *</label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as Role)}
              className="w-full px-3 py-2 bg-[#fdfcf9] border border-[#d9d0be] rounded-lg text-sm text-[#18221e] focus:outline-hidden focus:border-[#b8763a]"
            >
              <option value="staff">Clinic Staff (Appointments, Patients, Invoices)</option>
              <option value="admin">Administrator (Full Access: Therapists, Services, Users)</option>
            </select>
          </div>

          <div className="space-y-1 sm:col-span-2">
            <label className="font-semibold text-[#554d40]">
              {initial ? "Change Password (leave blank to keep current)" : "Initial Password"}
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={initial ? "••••••••" : "Default: welcome123"}
              className="w-full px-3 py-2 bg-[#fdfcf9] border border-[#d9d0be] rounded-lg text-sm text-[#18221e] focus:outline-hidden focus:border-[#b8763a]"
            />
          </div>
        </div>

        <div className="flex items-center gap-2 pt-1">
          <input
            type="checkbox"
            id="user-active"
            checked={isActive}
            onChange={(e) => setIsActive(e.target.checked)}
            className="w-4 h-4 rounded text-[#b8763a] focus:ring-0"
          />
          <label htmlFor="user-active" className="text-xs font-semibold text-[#18221e] cursor-pointer">
            User Account Active (Permitted to log in to Practice Workspace)
          </label>
        </div>

        {error && (
          <div className="p-3 bg-[#fbeaea] border border-[#f1c5c1] text-[#b5493b] text-xs rounded-lg">
            {error}
          </div>
        )}

        <div className="flex justify-end gap-2.5 pt-4 border-t border-[#eee7d8]">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-[#554d40] bg-[#f4ede1] hover:bg-[#eae1d0] rounded-xl transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={busy}
            className="px-5 py-2 text-xs font-semibold text-white bg-[#b8763a] hover:bg-[#a3652e] disabled:opacity-50 rounded-xl transition-colors shadow-xs"
          >
            {busy ? "Saving..." : initial ? "Update User" : "Create Account"}
          </button>
        </div>
      </form>
    </Modal>
  );
}

// ----------------- MAIN DASHBOARD CONTAINER -----------------
export default function DashboardPage() {
  const [user, setUser] = useState<User | null>(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("physiodesk_user");
      if (stored) {
        try {
          return JSON.parse(stored) as User;
        } catch {
          return null;
        }
      }
    }
    return null;
  });

  const [view, setView] = useState<View>("Dashboard");
  const [dashboard, setDashboard] = useState<Dashboard | null>(null);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [therapists, setTherapists] = useState<Therapist[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const reloadAll = async () => {
    setLoading(true);
    setError("");
    try {
      const [dash, patientData, therapistData, apptData, invoiceData] =
        await Promise.all([
          api.dashboard(),
          api.patients({ include_inactive: true }),
          api.therapists(),
          api.appointments(),
          api.invoices(),
        ]);
      setDashboard(dash);
      setPatients(patientData);
      setTherapists(therapistData);
      setAppointments(apptData);
      setInvoices(invoiceData);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load clinical data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!user) return;
    let active = true;

    Promise.all([
      api.dashboard(),
      api.patients({ include_inactive: true }),
      api.therapists(),
      api.appointments(),
      api.invoices(),
    ])
      .then(([dash, patientData, therapistData, apptData, invoiceData]) => {
        if (!active) return;
        setDashboard(dash);
        setPatients(patientData);
        setTherapists(therapistData);
        setAppointments(apptData);
        setInvoices(invoiceData);
        setLoading(false);
      })
      .catch((err) => {
        if (!active) return;
        setError(err instanceof Error ? err.message : "Failed to load clinical data");
        setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [user]);

  if (!user) {
    return <LoginView onLogin={setUser} />;
  }

  const navItems: { label: View; icon: React.ComponentType<{ className?: string }> }[] = [
    { label: "Dashboard", icon: LayoutDashboard },
    { label: "Patients", icon: Users },
    { label: "Schedule", icon: CalendarIcon },
    { label: "Billing", icon: Receipt },
    ...(user.role === "admin"
      ? [
          { label: "Therapists" as View, icon: Stethoscope },
          { label: "Services" as View, icon: Sparkles },
          { label: "Users" as View, icon: UserCog },
        ]
      : []),
  ];

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-[#fbf9f4] text-[#18221e]">
      {/* Sidebar */}
      <aside className="w-full md:w-64 bg-[#132420] text-white p-5 flex flex-col shrink-0 border-r border-[#233d36]">
        {/* Brand */}
        <div className="flex items-center gap-3 pb-6 border-b border-[#233d36]">
          <div className="w-9 h-9 rounded-xl bg-[#b8763a] text-[#132420] font-serif font-bold text-lg flex items-center justify-center">
            P
          </div>
          <div>
            <span className="font-serif font-semibold text-base text-[#f0dfc7] block">
              Physio Desk
            </span>
            <span className="text-[11px] text-[#a6b0ae] block">Practice Operations</span>
          </div>
        </div>

        {/* Navigation */}
        <nav className="py-6 space-y-1 flex-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = view === item.label;

            return (
              <button
                key={item.label}
                onClick={() => setView(item.label)}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all ${
                  active
                    ? "bg-[#b8763a] text-white font-semibold shadow-xs"
                    : "text-[#d0d7d5] hover:bg-[#1d362f] hover:text-white"
                }`}
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Back to Patient Booking & User Session */}
        <div className="pt-4 border-t border-[#233d36] space-y-3">
          <Link
            href="/"
            className="flex items-center gap-2 text-xs text-[#f0dfc7] hover:text-white transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Patient Booking Portal</span>
          </Link>

          <div className="flex items-center justify-between pt-2 border-t border-[#233d36]/60">
            <div className="min-w-0">
              <div className="text-xs font-bold text-white truncate">{user.full_name}</div>
              <div className="text-[10px] text-[#a6b0ae] capitalize">{user.role}</div>
            </div>
            <button
              onClick={() => {
                clearSession();
                setUser(null);
              }}
              className="p-1.5 text-[#a6b0ae] hover:text-white rounded-lg transition-colors"
              title="Log out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 min-w-0 p-5 sm:p-8 overflow-y-auto">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-wider text-[#857d6f]">
              Clinic Workspace
            </div>
            <h1 className="text-2xl sm:text-3xl font-serif font-medium text-[#18221e] mt-1">
              {view === "Dashboard" ? "Practice Overview" : view}
            </h1>
          </div>

          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#e1ebe3] text-[#3b664e] text-xs font-semibold rounded-full border border-[#bed4c3]">
              <span className="w-2 h-2 rounded-full bg-[#4f7c63] animate-pulse" />
              Store Synced
            </span>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-[#fbeaea] border border-[#f1c5c1] text-[#b5493b] text-xs rounded-xl flex items-center justify-between">
            <span>{error}</span>
            <button onClick={reloadAll} className="underline font-bold">
              Retry
            </button>
          </div>
        )}

        {/* Tab View */}
        {loading && view !== "Dashboard" ? (
          <div className="p-12 text-center text-sm text-[#716a5d] bg-white rounded-2xl border border-[#ded5c2]">
            Loading practice data...
          </div>
        ) : view === "Dashboard" ? (
          <OverviewTab dashboard={dashboard} onNavigate={setView} />
        ) : view === "Patients" ? (
          <PatientsTab patients={patients} therapists={therapists} onReload={reloadAll} />
        ) : view === "Schedule" ? (
          <ScheduleTab
            appointments={appointments}
            patients={patients}
            therapists={therapists}
            onReload={reloadAll}
          />
        ) : view === "Billing" ? (
          <BillingTab invoices={invoices} patients={patients} onReload={reloadAll} />
        ) : view === "Therapists" ? (
          <TherapistsTab therapists={therapists} role={user.role} onReload={reloadAll} />
        ) : view === "Services" ? (
          <ServicesTab role={user.role} onReload={reloadAll} />
        ) : view === "Users" ? (
          <UsersTab role={user.role} currentUser={user} onReload={reloadAll} />
        ) : null}
      </main>
    </div>
  );
}
