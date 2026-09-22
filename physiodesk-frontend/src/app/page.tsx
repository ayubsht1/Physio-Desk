"use client";

import { useEffect, useMemo, useState } from "react";

const palette = {
  primary: "#B8763A",
  primarySoft: "#F0DFC7",
  primaryTextOnSoft: "#5C3A17",
  secondary: "#132420",
  secondaryLight: "#1D362F",
  tertiary: "#4F7C63",
  tertiarySoft: "#E1EBE3",
  background: "#F6F3EA",
  surface: "#FFFFFF",
  border: "#E4DFD1",
  textPrimary: "#1C2622",
  textSecondary: "#797365",
  success: "#4F7C63",
  successSoft: "#E1EBE3",
  error: "#B5493B",
  errorSoft: "#F3DEDA",
  neutral: "#5E6B78",
  neutralSoft: "#E7EBEE",
};

const sidebarItems = ["Dashboard", "Patients", "Schedule", "Billing", "Therapists"];

const statusColors: Record<string, { bg: string; text: string }> = {
  Paid: { bg: palette.successSoft, text: palette.success },
  Due: { bg: palette.neutralSoft, text: palette.neutral },
  Active: { bg: palette.successSoft, text: palette.success },
  "On hold": { bg: palette.neutralSoft, text: palette.neutral },
  Completed: { bg: palette.primarySoft, text: palette.primaryTextOnSoft },
  Overdue: { bg: palette.errorSoft, text: palette.error },
  Cancelled: { bg: palette.errorSoft, text: palette.error },
};

const statCards = [
  { label: "Patients today", value: "28", change: "+12%" },
  { label: "Therapists on duty", value: "4", change: "2 late check-ins" },
  { label: "Revenue", value: "$8,420", change: "+$1,180" },
  { label: "Open slots", value: "18", change: "Across all therapists" },
];

const patients = [
  { name: "Nina Foster", condition: "Knee strain", therapist: "Maya Chen", package: "Starter Plan", status: "Active" },
  { name: "Omar Lee", condition: "Lower back pain", therapist: "Daniel Brooks", package: "Recovery Plus", status: "Completed" },
  { name: "Sara Nguyen", condition: "Shoulder mobility", therapist: "Priya Shah", package: "Core Therapy", status: "Active" },
  { name: "Alicia Ford", condition: "Balance retraining", therapist: "Lucas Martin", package: "Senior Care", status: "On hold" },
  { name: "Mason Reed", condition: "Ankle rehab", therapist: "Daniel Brooks", package: "Quick Fix", status: "Active" },
];

const schedule = [
  { time: "09:00", Maya: "Booked - Nina", Daniel: "Open", Priya: "Open", Lucas: "Off" },
  { time: "10:00", Maya: "Booked - Leah", Daniel: "Open", Priya: "Booked - Zoe", Lucas: "Off" },
  { time: "11:00", Maya: "Open", Daniel: "Booked - Omar", Priya: "Open", Lucas: "Booked - Alicia" },
  { time: "12:00", Maya: "Open", Daniel: "Open", Priya: "Booked - Sara", Lucas: "Open" },
  { time: "13:00", Maya: "Open", Daniel: "Booked - Mason", Priya: "Open", Lucas: "Open" },
  { time: "14:00", Maya: "Booked - Ethan", Daniel: "Open", Priya: "Open", Lucas: "Booked - Isaac" },
];

const tableData = [
  { name: "Nina Foster", phone: "(555) 1001", therapist: "Maya Chen", status: "Active", package: "Starter Plan" },
  { name: "Omar Lee", phone: "(555) 1002", therapist: "Daniel Brooks", status: "Completed", package: "Recovery Plus" },
  { name: "Sara Nguyen", phone: "(555) 1003", therapist: "Priya Shah", status: "Active", package: "Core Therapy" },
  { name: "Alicia Ford", phone: "(555) 1005", therapist: "Lucas Martin", status: "On hold", package: "Senior Care" },
  { name: "Isaac Moore", phone: "(555) 1008", therapist: "Lucas Martin", status: "Active", package: "Recovery Plus" },
];

const invoices = [
  { patient: "Nina Foster", date: "Jun 10", service: "Initial Assessment", amount: "$180", status: "Paid" },
  { patient: "Omar Lee", date: "Jun 07", service: "Manual Therapy", amount: "$260", status: "Paid" },
  { patient: "Sara Nguyen", date: "Jun 05", service: "Sports Rehab", amount: "$310", status: "Due" },
  { patient: "Mason Reed", date: "Jun 04", service: "Ankle Rehab", amount: "$150", status: "Paid" },
];

const therapists = [
  { name: "Maya Chen", specialty: "Sports Rehab", hours: "27h", patients: 8 },
  { name: "Daniel Brooks", specialty: "Neurological Recovery", hours: "31h", patients: 6 },
  { name: "Priya Shah", specialty: "Mobility", hours: "24h", patients: 5 },
  { name: "Lucas Martin", specialty: "Manual Therapy", hours: "18h", patients: 4 },
];

function Tag({ text }: { text: string }) {
  const style = statusColors[text] ?? { bg: palette.primarySoft, text: palette.primaryTextOnSoft };
  return (
    <span
      style={{ backgroundColor: style.bg, color: style.text }}
      className="inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-medium uppercase tracking-[0.08em]"
    >
      {text}
    </span>
  );
}

export default function Page() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const displayStatCards = useMemo(() => statCards, []);

  if (!mounted) return null;

  return (
    <div style={{ backgroundColor: palette.background, color: palette.textPrimary }} className="min-h-screen font-sans">
      <div className="flex min-h-screen">
        <aside style={{ backgroundColor: palette.secondary }} className="w-[260px] px-6 py-7 text-white">
          <div className="mb-8 flex items-center gap-3">
            <div style={{ backgroundColor: palette.primary, color: palette.secondary }} className="flex h-10 w-10 items-center justify-center rounded-xl text-lg font-bold">P</div>
            <div>
              <div style={{ color: palette.primarySoft }} className="text-xl font-semibold">Physio Desk</div>
              <div style={{ color: "#a6b0ae" }} className="text-xs tracking-[0.12em] uppercase">Practice</div>
            </div>
          </div>

          <nav className="space-y-2">
            {sidebarItems.map((item, index) => (
              <button
                key={item}
                className="flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left text-sm font-medium transition"
                style={{
                  backgroundColor: index === 0 ? palette.primary : "transparent",
                  color: index === 0 ? palette.secondary : "#e9ecea",
                }}
              >
                <span>{item}</span>
                {index === 0 && <span className="h-2 w-2 rounded-full" style={{ backgroundColor: palette.secondary }} />}
              </button>
            ))}
          </nav>

          <div className="mt-10 rounded-2xl border border-white/10 p-4" style={{ backgroundColor: palette.secondaryLight }}>
            <div className="text-xs uppercase tracking-[0.12em]" style={{ color: "#a6b0ae" }}>Care team</div>
            <div className="mt-3 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-sm font-semibold">AR</div>
              <div>
                <div className="font-medium">Aisha Patel</div>
                <div className="text-xs" style={{ color: "#a6b0ae" }}>Admin</div>
              </div>
            </div>
          </div>
        </aside>

        <main className="flex-1 p-6 md:p-8">
          <header className="mb-6 flex items-center justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-[0.16em]" style={{ color: palette.textSecondary }}>Overview</p>
              <h1 className="mt-2 text-4xl font-semibold" style={{ fontFamily: '"Fraunces", serif' }}>Dashboard</h1>
            </div>
            <button
              style={{ backgroundColor: palette.primary, color: "#fff" }}
              className="rounded-full px-5 py-2.5 text-sm font-medium shadow-sm"
            >
              + New patient
            </button>
          </header>

          <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {displayStatCards.map((card) => (
              <div key={card.label} style={{ backgroundColor: palette.surface, borderColor: palette.border }} className="rounded-2xl border p-5 shadow-sm">
                <div className="text-xs uppercase tracking-[0.12em]" style={{ color: palette.textSecondary }}>{card.label}</div>
                <div className="mt-4 text-3xl" style={{ fontFamily: '"Fraunces", serif' }}>{card.value}</div>
                <div className="mt-2 text-xs" style={{ color: palette.tertiary }}>{card.change}</div>
              </div>
            ))}
          </section>

          <div className="mt-6 grid gap-6 xl:grid-cols-[1.5fr_0.9fr]">
            <section style={{ backgroundColor: palette.surface, borderColor: palette.border }} className="rounded-2xl border p-5 shadow-sm">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-xl" style={{ fontFamily: '"Fraunces", serif' }}>Therapist capacity</h2>
                <button className="text-sm" style={{ color: palette.primary }}>View schedule</button>
              </div>
              <div className="overflow-hidden rounded-xl border" style={{ borderColor: palette.border }}>
                <table className="w-full text-left text-sm">
                  <thead style={{ backgroundColor: "#f9f5ee" }}>
                    <tr>
                      <th className="p-3 font-medium">Therapist</th>
                      <th className="p-3 font-medium">Booked</th>
                      <th className="p-3 font-medium">Free</th>
                      <th className="p-3 font-medium">Load</th>
                    </tr>
                  </thead>
                  <tbody>
                    {therapists.map((t) => (
                      <tr key={t.name} className="border-t" style={{ borderColor: palette.border }}>
                        <td className="p-3">
                          <div className="font-medium">{t.name}</div>
                          <div className="text-xs" style={{ color: palette.textSecondary }}>{t.specialty}</div>
                        </td>
                        <td className="p-3">{t.patients}</td>
                        <td className="p-3">{Math.max(8 - t.patients, 1)}</td>
                        <td className="p-3">
                          <div className="h-2 rounded-full" style={{ backgroundColor: palette.primarySoft }}>
                            <div className="h-2 rounded-full" style={{ width: `${Math.min(t.patients * 12, 100)}%`, backgroundColor: palette.primary }} />
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            <section style={{ backgroundColor: palette.surface, borderColor: palette.border }} className="rounded-2xl border p-5 shadow-sm">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-xl" style={{ fontFamily: '"Fraunces", serif' }}>Recent patients</h2>
                <button className="text-sm" style={{ color: palette.primary }}>All patients</button>
              </div>
              <div className="space-y-3">
                {patients.map((p) => (
                  <div key={p.name} className="flex items-center justify-between gap-4 rounded-xl border p-3" style={{ borderColor: palette.border }}>
                    <div>
                      <div className="font-medium">{p.name}</div>
                      <div className="text-xs" style={{ color: palette.textSecondary }}>{p.condition}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs" style={{ color: palette.textSecondary }}>{p.therapist}</div>
                      <Tag text={p.status} />
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>

          <div className="mt-6 grid gap-6 xl:grid-cols-[1.3fr_0.7fr]">
            <section style={{ backgroundColor: palette.surface, borderColor: palette.border }} className="rounded-2xl border p-5 shadow-sm">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-xl" style={{ fontFamily: '"Fraunces", serif' }}>Today&apos;s schedule</h2>
                <button className="rounded-full border px-3 py-1.5 text-sm" style={{ borderColor: palette.border, color: palette.primaryTextOnSoft }}>Book appointment</button>
              </div>
              <div className="overflow-hidden rounded-xl border" style={{ borderColor: palette.border }}>
                <table className="w-full text-left text-sm">
                  <thead style={{ backgroundColor: "#f9f5ee" }}>
                    <tr>
                      <th className="p-3 font-medium">Time</th>
                      <th className="p-3 font-medium">Maya</th>
                      <th className="p-3 font-medium">Daniel</th>
                      <th className="p-3 font-medium">Priya</th>
                      <th className="p-3 font-medium">Lucas</th>
                    </tr>
                  </thead>
                  <tbody>
                    {schedule.map((row) => (
                      <tr key={row.time} className="border-t" style={{ borderColor: palette.border }}>
                        <td className="p-3 font-medium" style={{ color: palette.textSecondary }}>{row.time}</td>
                        {Object.entries(row).filter(([key]) => key !== "time").map(([key, value]) => (
                          <td key={key} className="p-3">
                            <span className="rounded-full px-2 py-1 text-[11px] font-medium" style={{ backgroundColor: value.includes("Booked") ? palette.tertiarySoft : value === "Off" ? palette.neutralSoft : palette.primarySoft, color: value.includes("Booked") ? palette.success : value === "Off" ? palette.neutral : palette.primaryTextOnSoft }}>
                              {value}
                            </span>
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            <section style={{ backgroundColor: palette.surface, borderColor: palette.border }} className="rounded-2xl border p-5 shadow-sm">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-xl" style={{ fontFamily: '"Fraunces", serif' }}>Patients</h2>
                <button className="text-sm" style={{ color: palette.primary }}>Add</button>
              </div>
              <div className="space-y-3">
                {tableData.map((p) => (
                  <div key={p.name} className="rounded-xl border p-3" style={{ borderColor: palette.border }}>
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <div className="font-medium">{p.name}</div>
                        <div className="text-xs" style={{ color: palette.textSecondary }}>{p.phone}</div>
                      </div>
                      <Tag text={p.status} />
                    </div>
                    <div className="mt-3 flex justify-between text-xs" style={{ color: palette.textSecondary }}>
                      <span>{p.therapist}</span>
                      <span>{p.package}</span>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>

          <div className="mt-6 grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
            <section style={{ backgroundColor: palette.surface, borderColor: palette.border }} className="rounded-2xl border p-5 shadow-sm">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-xl" style={{ fontFamily: '"Fraunces", serif' }}>Invoices</h2>
                <button className="rounded-full border px-3 py-1.5 text-sm" style={{ borderColor: palette.border, color: palette.primaryTextOnSoft }}>Create bill</button>
              </div>
              <div className="overflow-hidden rounded-xl border" style={{ borderColor: palette.border }}>
                <table className="w-full text-left text-sm">
                  <thead style={{ backgroundColor: "#f9f5ee" }}>
                    <tr>
                      <th className="p-3 font-medium">Patient</th>
                      <th className="p-3 font-medium">Service</th>
                      <th className="p-3 font-medium">Amount</th>
                      <th className="p-3 font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {invoices.map((invoice) => (
                      <tr key={`${invoice.patient}-${invoice.date}`} className="border-t" style={{ borderColor: palette.border }}>
                        <td className="p-3">
                          <div className="font-medium">{invoice.patient}</div>
                          <div className="text-xs" style={{ color: palette.textSecondary }}>{invoice.date}</div>
                        </td>
                        <td className="p-3">{invoice.service}</td>
                        <td className="p-3" style={{ fontFamily: '"IBM Plex Mono", monospace' }}>{invoice.amount}</td>
                        <td className="p-3"><Tag text={invoice.status} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            <section style={{ backgroundColor: palette.surface, borderColor: palette.border }} className="rounded-2xl border p-5 shadow-sm">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-xl" style={{ fontFamily: '"Fraunces", serif' }}>Therapists</h2>
                <button className="text-sm" style={{ color: palette.primary }}>Roster</button>
              </div>
              <div className="space-y-3">
                {therapists.map((therapist) => (
                  <div key={therapist.name} className="rounded-xl border p-3" style={{ borderColor: palette.border }}>
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <div className="font-medium">{therapist.name}</div>
                        <div className="text-xs" style={{ color: palette.textSecondary }}>{therapist.specialty}</div>
                      </div>
                      <Tag text="Active" />
                    </div>
                    <div className="mt-3 flex justify-between text-xs" style={{ color: palette.textSecondary }}>
                      <span>{therapist.hours}</span>
                      <span>{therapist.patients} patients today</span>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>
        </main>
      </div>
    </div>
  );
}
