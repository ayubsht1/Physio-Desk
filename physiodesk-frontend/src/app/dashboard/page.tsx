"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Users, Calendar as CalendarIcon, Receipt, Stethoscope, LayoutDashboard, LogOut, ArrowLeft, UserCog, Sparkles } from "lucide-react";
import { api, Appointment, Dashboard, Invoice, Patient, Therapist, User, clearSession } from "@/lib/api";
import { BillingTab } from "@/components/dashboard/billing";
import { LoginView } from "@/components/dashboard/login";
import { OverviewTab } from "@/components/dashboard/overview";
import { PatientsTab } from "@/components/dashboard/patients";
import { ScheduleTab } from "@/components/dashboard/schedule";
import { ServicesTab } from "@/components/dashboard/services";
import { TherapistsTab } from "@/components/dashboard/therapists";
import { UsersTab } from "@/components/dashboard/users";
import type { View } from "@/components/dashboard/types";

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
