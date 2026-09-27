"use client";
import { useState } from "react";
import Image from "next/image";
import { Plus } from "lucide-react";
import { api, Role, Therapist, TherapistPayload } from "@/lib/api";
import { StatusBadge, Modal } from "@/components/dashboard/shared";

export function TherapistsTab({
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
