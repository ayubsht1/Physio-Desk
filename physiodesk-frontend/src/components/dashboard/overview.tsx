"use client";
import { Users, Stethoscope, Clock, DollarSign } from "lucide-react";
import { Dashboard } from "@/lib/api";
import { money, StatusBadge } from "@/components/dashboard/shared";
import type { View } from "@/components/dashboard/types";

export function OverviewTab({
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
