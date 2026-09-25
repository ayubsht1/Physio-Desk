"use client";

import { useState } from "react";
import { motion } from "motion/react";
import {
  Search,
  Calendar,
  Clock,
  AlertCircle,
  XCircle,
  CheckCircle2,
  ArrowRight,
  Printer,
  MapPin,
} from "lucide-react";
import { api, Appointment } from "@/lib/api";

export function AppointmentLookup() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Appointment[] | null>(null);
  const [searching, setSearching] = useState(false);
  const [searchedQuery, setSearchedQuery] = useState("");
  const [actionMessage, setActionMessage] = useState("");
  const [cancellingId, setCancellingId] = useState<number | null>(null);

  const performSearch = async (term: string) => {
    if (!term.trim()) return;
    setSearching(true);
    setActionMessage("");
    setSearchedQuery(term.trim());

    try {
      const appointments = await api.appointments({ search: term.trim() });
      setResults(appointments);
    } catch (err) {
      console.error("Search failed", err);
      setResults([]);
    } finally {
      setSearching(false);
    }
  };

  const handleCancelAppointment = async (id: number) => {
    setCancellingId(id);
    try {
      await api.updateAppointment(id, { status: "Cancelled" });
      setActionMessage("Your appointment has been cancelled successfully.");
      if (searchedQuery) {
        const refreshed = await api.appointments({ search: searchedQuery });
        setResults(refreshed);
      }
    } catch (err) {
      setActionMessage(err instanceof Error ? err.message : "Failed to cancel appointment.");
    } finally {
      setCancellingId(null);
    }
  };

  const quickSearches = [
    { label: "Sunita Gurung", phone: "+977 9841234567" },
    { label: "Roshan Karki", phone: "+977 9801234568" },
    { label: "Anjali Maharjan", phone: "+977 9851023456" },
    { label: "Laxmi Shrestha", phone: "+977 9849876543" },
  ];

  return (
    <section id="lookup" className="py-16 md:py-24 bg-[#fbf9f4] border-b border-[#e5decb]">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-xl mx-auto mb-8">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white border border-[#ded5c2] text-xs font-semibold text-[#5c3a17] mb-3">
            <Search className="w-3.5 h-3.5 text-[#b8763a]" />
            Patient Self-Service Portal
          </div>
          <h2 className="text-3xl sm:text-4xl font-serif font-medium text-[#18221e] tracking-tight">
            Find Your Appointments
          </h2>
          <p className="mt-2 text-sm text-[#716a5d]">
            Enter your mobile number (+977 98XXXXXXXX), patient name, or booking ID to check
            your upcoming therapy sessions or past clinical visits.
          </p>
        </div>

        {/* Search Input Box */}
        <div className="bg-white border border-[#ded5c2] rounded-2xl shadow-sm p-4 sm:p-6 mb-6">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              performSearch(query);
            }}
            className="flex flex-col sm:flex-row gap-3"
          >
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-[#8a8172] absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Enter mobile (e.g. 9841234567) or Booking ID (e.g. PD-APT-1)"
                className="w-full pl-10 pr-4 py-3 bg-[#fdfcf9] border border-[#d9d0be] rounded-xl text-sm text-[#18221e] placeholder:text-[#999080] focus:outline-hidden focus:border-[#b8763a] focus:bg-white"
              />
            </div>
            <button
              type="submit"
              disabled={searching || !query.trim()}
              className="inline-flex items-center justify-center gap-2 px-6 py-3 text-sm font-semibold text-white bg-[#b8763a] hover:bg-[#a3652e] disabled:opacity-50 rounded-xl transition-all shadow-xs shrink-0"
            >
              {searching ? "Searching..." : "Lookup Sessions"}
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Quick Demo Fillers */}
          <div className="mt-4 pt-3 border-t border-[#f0e8da] flex flex-wrap items-center gap-2 text-xs text-[#716a5d]">
            <span className="font-medium text-[#554d40]">Sample patient records:</span>
            {quickSearches.map((item) => (
              <button
                key={item.phone}
                type="button"
                onClick={() => {
                  setQuery(item.phone);
                  performSearch(item.phone);
                }}
                className="px-2.5 py-1 bg-[#f4ede1] hover:bg-[#eee3d1] border border-[#e2d8c5] rounded-md text-[#5c3a17] transition-colors"
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>

        {/* Action Message Banner */}
        {actionMessage && (
          <motion.div
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 p-4 bg-[#e1ebe3] border border-[#bed4c3] text-[#2c533c] text-xs sm:text-sm rounded-xl flex items-center justify-between"
          >
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-[#4f7c63] shrink-0" />
              <span>{actionMessage}</span>
            </div>
            <button
              onClick={() => setActionMessage("")}
              className="text-xs text-[#4f7c63] underline font-semibold"
            >
              Dismiss
            </button>
          </motion.div>
        )}

        {/* Search Results Display */}
        {results !== null && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="space-y-4"
          >
            <div className="flex justify-between items-center px-1 text-xs text-[#716a5d]">
              <span>
                Search results for{" "}
                <b className="text-[#18221e]">&ldquo;{searchedQuery}&rdquo;</b>:
              </span>
              <span className="font-mono">{results.length} appointment(s) found</span>
            </div>

            {results.length === 0 ? (
              <div className="bg-white border border-[#ded5c2] rounded-2xl p-8 text-center space-y-3">
                <AlertCircle className="w-8 h-8 text-[#b8763a] mx-auto opacity-75" />
                <h4 className="text-base font-serif font-medium text-[#18221e]">
                  No Appointments Found
                </h4>
                <p className="text-xs sm:text-sm text-[#716a5d] max-w-md mx-auto">
                  We couldn&apos;t find any records matching that search term. Please verify your Nepal mobile
                  number format (+977 98XXXXXXXX) or schedule a new consultation.
                </p>
                <div className="pt-2">
                  <a
                    href="#book"
                    className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-[#b8763a] rounded-lg hover:bg-[#a3652e] transition-colors"
                  >
                    Schedule an Appointment
                  </a>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {results.map((appt) => {
                  const isBooked = appt.status === "Booked";
                  const isCompleted = appt.status === "Completed";

                  return (
                    <div
                      key={appt.id}
                      className="bg-white border border-[#ded5c2] rounded-2xl p-5 sm:p-6 shadow-xs transition-all hover:border-[#cfc4b2]"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#f0e8da] pb-4">
                        <div>
                          <div className="flex items-center gap-2.5">
                            <span className="text-xs font-mono font-bold text-[#b8763a] bg-[#faf5ec] border border-[#edd9be] px-2 py-0.5 rounded-md">
                              PD-APT-{appt.id}
                            </span>
                            <span
                              className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full ${
                                isBooked
                                  ? "bg-[#e1ebe3] text-[#3b664e]"
                                  : isCompleted
                                  ? "bg-[#e7ebee] text-[#4a5568]"
                                  : "bg-[#fbeaea] text-[#b5493b]"
                              }`}
                            >
                              {appt.status}
                            </span>
                          </div>
                          <h4 className="text-base font-serif font-medium text-[#18221e] mt-1.5">
                            {appt.service || "Physical Therapy Consultation"}
                          </h4>
                        </div>

                        {/* Date & Time badge */}
                        <div className="sm:text-right">
                          <div className="flex items-center sm:justify-end gap-1.5 text-sm font-semibold text-[#18221e]">
                            <Calendar className="w-4 h-4 text-[#b8763a]" />
                            <span>{appt.appointment_date}</span>
                          </div>
                          <div className="flex items-center sm:justify-end gap-1.5 text-xs text-[#716a5d] mt-0.5 font-mono">
                            <Clock className="w-3.5 h-3.5 text-[#857d6f]" />
                            <span>
                              {appt.start_time} – {appt.end_time}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Detail row */}
                      <div className="pt-4 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs text-[#6e675a]">
                        <div>
                          <span className="text-[#8e8574] block text-[11px]">Patient Name</span>
                          <span className="font-semibold text-[#18221e]">{appt.patient_name}</span>
                        </div>
                        <div>
                          <span className="text-[#8e8574] block text-[11px]">Consulting Doctor</span>
                          <span className="font-semibold text-[#18221e]">
                            {appt.therapist_name || "Specialist"}
                          </span>
                        </div>
                        <div>
                          <span className="text-[#8e8574] block text-[11px]">Payment Mode</span>
                          <span className="font-medium text-[#18221e]">
                            {appt.payment_method || "Fonepay / QR"}
                          </span>
                        </div>
                      </div>

                      {appt.notes && (
                        <div className="mt-3 p-2.5 bg-[#fbf9f4] border border-[#f0e8da] rounded-lg text-xs text-[#6e675a]">
                          <span className="font-semibold text-[#554d40]">Doctor notes:</span>{" "}
                          {appt.notes}
                        </div>
                      )}

                      {/* Card actions */}
                      <div className="mt-4 pt-3 border-t border-[#f0e8da] flex items-center justify-between text-xs">
                        <span className="text-[11px] text-[#8e8574] flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-[#b8763a]" />
                          Jhamsikhel-3, Lalitpur (Opposite St. Mary&apos;s Lane)
                        </span>

                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => window.print()}
                            className="inline-flex items-center gap-1 px-3 py-1.5 bg-white border border-[#ded5c2] hover:bg-[#fbf9f4] rounded-lg text-[#554d40] transition-colors"
                          >
                            <Printer className="w-3.5 h-3.5" />
                            Print
                          </button>

                          {isBooked && (
                            <button
                              type="button"
                              disabled={cancellingId === appt.id}
                              onClick={() => {
                                if (
                                  confirm(
                                    `Are you sure you want to cancel appointment PD-APT-${appt.id}?`
                                  )
                                ) {
                                  handleCancelAppointment(appt.id);
                                }
                              }}
                              className="inline-flex items-center gap-1 px-3 py-1.5 bg-white border border-[#f1c5c1] hover:bg-[#fbeaea] rounded-lg text-[#b5493b] font-medium transition-colors"
                            >
                              <XCircle className="w-3.5 h-3.5" />
                              {cancellingId === appt.id ? "Cancelling..." : "Cancel Booking"}
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </motion.div>
        )}
      </div>
    </section>
  );
}
