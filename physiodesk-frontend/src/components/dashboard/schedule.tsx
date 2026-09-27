"use client";
import { useMemo, useState } from "react";
import { Calendar as CalendarIcon, Plus } from "lucide-react";
import { api, Appointment, AppointmentPayload, Patient, Therapist } from "@/lib/api";
import { Modal } from "@/components/dashboard/shared";

export function ScheduleTab({
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
