"use client";

import { useEffect, useState, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import Image from "next/image";
import {
  Clock,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  ArrowLeft,
  Sparkles,
} from "lucide-react";
import { api, Therapist, Appointment, ClinicService } from "@/lib/api";

const DEFAULT_SERVICES: ClinicService[] = [
  {
    id: 1,
    service_id: "sports-rehab",
    name: "Sports Injury & ACL Rehabilitation",
    category: "Sports Rehab",
    duration: "45-60 min",
    price: 1800,
    price_display: "Rs. 1,800",
    description: "Targeted protocol for acute joint sprains, torn ligaments, kinetic chain re-education, and return-to-play testing.",
    indications: "ACL sprain, Meniscus tear, Ankle syndesmosis",
    is_active: true,
  },
  {
    id: 2,
    service_id: "spine-posture",
    name: "Spine, Posture & Cervical Decompression",
    category: "Spine & Joint",
    duration: "30-45 min",
    price: 1500,
    price_display: "Rs. 1,500",
    description: "Relief for disc herniations, ergonomic thoracic stiffness, and cervical radiculopathy.",
    indications: "L4-L5 protrusion, Cervical radiculopathy",
    is_active: true,
  },
  {
    id: 3,
    service_id: "neuro-rehab",
    name: "Neurological & Stroke Rehabilitation",
    category: "Neurological",
    duration: "45 min",
    price: 2000,
    price_display: "Rs. 2,000",
    description: "Gait retraining, proprioception re-education, vestibular and stroke mobility recovery.",
    indications: "Stroke hemiparesis, Vestibular BPPV",
    is_active: true,
  },
  {
    id: 4,
    service_id: "joint-manual",
    name: "Manual Therapy & Joint Mobilization",
    category: "Manual Therapy",
    duration: "60 min",
    price: 2200,
    price_display: "Rs. 2,200",
    description: "Hands-on joint mobilization, deep tissue myofascial release, and kinetic adjustment.",
    indications: "Frozen shoulder, Adhesive capsulitis",
    is_active: true,
  },
  {
    id: 5,
    service_id: "general-eval",
    name: "Comprehensive Initial Physical Assessment",
    category: "Evaluation",
    duration: "45 min",
    price: 1200,
    price_display: "Rs. 1,200",
    description: "Full functional movement screen, biomechanical review, and customized care blueprint.",
    indications: "New patients, Baseline assessment",
    is_active: true,
  },
];

export function BookingSection() {
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [services, setServices] = useState<ClinicService[]>(DEFAULT_SERVICES);
  const [therapists, setTherapists] = useState<Therapist[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);

  // Form State
  const [selectedService, setSelectedService] = useState<ClinicService>(DEFAULT_SERVICES[0]);
  const [selectedTherapistId, setSelectedTherapistId] = useState<number | null>(null);

  // Default to today or tomorrow
  const getTomorrowStr = () => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().slice(0, 10);
  };
  const [selectedDate, setSelectedDate] = useState<string>(getTomorrowStr());
  const [selectedSlot, setSelectedSlot] = useState<string>("");

  // Patient Info (aligned with SQLAlchemy model and localized for Nepal)
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("+977 ");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [gender, setGender] = useState("Female");
  const [bloodGroup, setBloodGroup] = useState("");
  const [allergies, setAllergies] = useState("");
  const [medicalNotes, setMedicalNotes] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("Fonepay / QR");

  // Submission State
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [confirmedBooking, setConfirmedBooking] = useState<{
    appointmentId: number;
    patientName: string;
    therapistName: string;
    date: string;
    time: string;
    service: string;
    phone: string;
    fee: string;
  } | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        const [serviceData, therapistData, apptData] = await Promise.all([
          api.services().catch(() => DEFAULT_SERVICES),
          api.therapists(),
          api.appointments(),
        ]);

        if (serviceData && serviceData.length > 0) {
          setServices(serviceData);
          setSelectedService(serviceData[0]);
        }

        const activeList = therapistData.filter((t) => t.is_active);
        setTherapists(activeList);
        if (activeList.length > 0 && selectedTherapistId === null) {
          setSelectedTherapistId(activeList[0].id);
        }
        setAppointments(apptData);
      } catch (err) {
        console.error("Failed to load booking data", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [selectedTherapistId]);

  const selectedTherapist = useMemo(() => {
    return therapists.find((t) => t.id === selectedTherapistId) ?? therapists[0] ?? null;
  }, [therapists, selectedTherapistId]);

  // Compute available slots
  const availableSlots = useMemo(() => {
    if (!selectedTherapist || !selectedDate) return [];

    const dateObj = new Date(selectedDate + "T00:00:00");
    const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const dayShort = dayNames[dateObj.getDay()];

    const therapistDays = selectedTherapist.working_days
      .split(",")
      .map((d) => d.trim().slice(0, 3));

    if (!therapistDays.includes(dayShort)) {
      return [];
    }

    const [startH, startM] = selectedTherapist.start_time.split(":").map(Number);
    const [endH, endM] = selectedTherapist.end_time.split(":").map(Number);
    const slotDuration = selectedTherapist.slot_duration || 30;

    const totalMinutes = (endH * 60 + endM) - (startH * 60 + startM);
    const totalSlots = Math.floor(totalMinutes / slotDuration);

    const generated: string[] = [];
    let currentMins = startH * 60 + startM;

    for (let i = 0; i < totalSlots; i++) {
      const h = Math.floor(currentMins / 60);
      const m = currentMins % 60;
      const timeStr = `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;

      const isBooked = appointments.some(
        (a) =>
          a.therapist_id === selectedTherapist.id &&
          a.appointment_date === selectedDate &&
          a.start_time === timeStr &&
          a.status !== "Cancelled"
      );

      if (!isBooked) {
        generated.push(timeStr);
      }

      currentMins += slotDuration;
    }

    return generated;
  }, [selectedTherapist, selectedDate, appointments]);

  const handleBookingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTherapist || !selectedSlot) {
      setSubmitError("Please pick a specialist, date, and valid consultation slot.");
      return;
    }
    if (!firstName.trim() || !lastName.trim() || !phone.trim() || phone.trim() === "+977") {
      setSubmitError("Please provide patient name and a valid Nepal mobile number (+977 98XXXXXXXX).");
      return;
    }

    setSubmitting(true);
    setSubmitError("");

    try {
      const cleanPhone = phone.trim();
      const existing = await api.patients({ search: cleanPhone });
      let patientId: number;

      const digitsOnly = cleanPhone.replace(/\D/g, "");
      const matchedPatient = existing.find(
        (p) => p.phone.replace(/\D/g, "").slice(-9) === digitsOnly.slice(-9)
      );

      if (matchedPatient) {
        patientId = matchedPatient.id;
        await api.updatePatient(patientId, {
          assigned_therapist_id: selectedTherapist.id,
          medical_notes: medicalNotes ? medicalNotes : matchedPatient.medical_notes,
          allergies: allergies ? allergies : matchedPatient.allergies,
          address: address.trim() || matchedPatient.address,
        });
      } else {
        const newPatient = await api.createPatient({
          first_name: firstName.trim(),
          last_name: lastName.trim(),
          phone: cleanPhone,
          email: email.trim() || null,
          date_of_birth: dateOfBirth || null,
          gender: gender,
          address: address.trim() || "Kathmandu Valley, Nepal",
          blood_group: bloodGroup || null,
          allergies: allergies || null,
          medical_notes: medicalNotes || selectedService.name,
          assigned_therapist_id: selectedTherapist.id,
          status: "Active",
          condition: selectedService.name,
        });
        patientId = newPatient.id;
      }

      // End time calculation
      const [sh, sm] = selectedSlot.split(":").map(Number);
      const slotDuration = selectedTherapist.slot_duration || 30;
      const endTotalMins = sh * 60 + sm + slotDuration;
      const eh = Math.floor(endTotalMins / 60);
      const em = endTotalMins % 60;
      const endTimeStr = `${String(eh).padStart(2, "0")}:${String(em).padStart(2, "0")}`;

      const newAppt = await api.createAppointment({
        patient_id: patientId,
        therapist_id: selectedTherapist.id,
        appointment_date: selectedDate,
        start_time: selectedSlot,
        end_time: endTimeStr,
        service: selectedService.name,
        notes: `Program: ${selectedService.name} (${selectedService.price_display}). Patient note: ${medicalNotes || "None"}`,
        payment_method: paymentMethod,
        status: "Booked",
      });

      setConfirmedBooking({
        appointmentId: newAppt.id,
        patientName: `${firstName.trim()} ${lastName.trim()}`,
        therapistName: selectedTherapist.name,
        date: selectedDate,
        time: selectedSlot,
        service: selectedService.name,
        phone: cleanPhone,
        fee: selectedService.price_display,
      });

      const refreshedAppts = await api.appointments();
      setAppointments(refreshedAppts);

      setStep(4);
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Failed to confirm appointment. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setStep(1);
    setConfirmedBooking(null);
    setSelectedSlot("");
    setFirstName("");
    setLastName("");
    setPhone("+977 ");
    setEmail("");
    setAddress("");
    setMedicalNotes("");
    setSubmitError("");
  };

  return (
    <section id="book" className="py-16 md:py-24 bg-[#f4ede1] border-b border-[#e5decb]">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-10">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white border border-[#dcd3c1] text-xs font-semibold text-[#5c3a17] mb-3">
            <Sparkles className="w-3.5 h-3.5 text-[#b8763a]" />
            Online Patient Booking · Kathmandu & Lalitpur
          </div>
          <h2 className="text-3xl sm:text-4xl font-serif font-medium text-[#18221e] tracking-tight">
            Schedule Your Clinical Consultation
          </h2>
          <p className="mt-2 text-sm sm:text-base text-[#675f50]">
            Select your clinical rehabilitation program, choose an accredited physiotherapist, and reserve
            your appointment in three simple steps.
          </p>
        </div>

        {/* Multi-Step Card */}
        <div className="bg-white border border-[#ded5c2] rounded-2xl shadow-lg overflow-hidden">
          {/* Progress Indicators */}
          {step < 4 && (
            <div className="border-b border-[#eee7d8] bg-[#fdfcf9] px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-2 sm:gap-4 text-xs font-medium">
                <button
                  onClick={() => setStep(1)}
                  className={`flex items-center gap-1.5 transition-colors ${
                    step === 1 ? "text-[#b8763a] font-bold" : "text-[#7a7263]"
                  }`}
                >
                  <span
                    className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${
                      step === 1 ? "bg-[#b8763a] text-white" : "bg-[#ede4d4] text-[#554d40]"
                    }`}
                  >
                    1
                  </span>
                  <span>Treatment Program</span>
                </button>
                <span className="text-[#cdc3b1]">/</span>

                <button
                  onClick={() => setStep(2)}
                  className={`flex items-center gap-1.5 transition-colors ${
                    step === 2 ? "text-[#b8763a] font-bold" : "text-[#7a7263]"
                  }`}
                >
                  <span
                    className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${
                      step === 2 ? "bg-[#b8763a] text-white" : "bg-[#ede4d4] text-[#554d40]"
                    }`}
                  >
                    2
                  </span>
                  <span>Doctor & Slot</span>
                </button>
                <span className="text-[#cdc3b1]">/</span>

                <button
                  onClick={() => {
                    if (selectedSlot) setStep(3);
                  }}
                  className={`flex items-center gap-1.5 transition-colors ${
                    step === 3 ? "text-[#b8763a] font-bold" : "text-[#7a7263]"
                  }`}
                >
                  <span
                    className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${
                      step === 3 ? "bg-[#b8763a] text-white" : "bg-[#ede4d4] text-[#554d40]"
                    }`}
                  >
                    3
                  </span>
                  <span>Patient Intake</span>
                </button>
              </div>

              <div className="text-xs text-[#7a7263] hidden sm:block">
                Step {step} of 3
              </div>
            </div>
          )}

          <div className="p-6 sm:p-8">
            <AnimatePresence mode="wait">
              {/* STEP 1: SERVICE SELECTION */}
              {step === 1 && (
                <motion.div
                  key="step-1"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  transition={{ duration: 0.2 }}
                  className="space-y-6"
                >
                  <div>
                    <h3 className="text-xl font-serif font-medium text-[#18221e]">
                      Choose Clinical Treatment Program
                    </h3>
                    <p className="text-xs sm:text-sm text-[#716a5d] mt-1">
                      All rates are shown in Nepalese Rupees (NPR). Managed by NHPC licensed therapists.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                    {services.map((srv) => {
                      const isSelected = selectedService.id === srv.id;
                      return (
                        <div
                          key={srv.id}
                          onClick={() => setSelectedService(srv)}
                          className={`p-4 rounded-xl border text-left cursor-pointer transition-all ${
                            isSelected
                              ? "bg-[#faf5ec] border-[#b8763a] shadow-xs"
                              : "bg-[#fdfcf9] border-[#e8dfcf] hover:border-[#cfc4b2] hover:bg-white"
                          }`}
                        >
                          <div className="flex justify-between items-start gap-2">
                            <span className="font-semibold text-sm text-[#18221e]">
                              {srv.name}
                            </span>
                            <span className="text-xs font-mono font-bold text-[#b8763a] bg-[#f0dfc7] px-2 py-0.5 rounded shrink-0">
                              {srv.price_display}
                            </span>
                          </div>
                          <p className="text-xs text-[#6e675a] mt-2 leading-relaxed">
                            {srv.description}
                          </p>
                          <div className="mt-3 flex items-center justify-between text-[11px] text-[#857d6f] pt-2 border-t border-[#f0e7d7]">
                            <span className="flex items-center gap-1 font-mono">
                              <Clock className="w-3 h-3 text-[#b8763a]" />
                              {srv.duration}
                            </span>
                            {isSelected && (
                              <span className="text-[#b8763a] font-medium flex items-center gap-1">
                                <CheckCircle2 className="w-3.5 h-3.5" /> Selected
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <div className="pt-4 flex justify-end">
                    <button
                      type="button"
                      onClick={() => setStep(2)}
                      className="inline-flex items-center gap-2 px-6 py-3 text-sm font-semibold text-white bg-[#b8763a] hover:bg-[#a3652e] rounded-xl transition-all shadow-sm"
                    >
                      Continue to Doctor & Slot
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </motion.div>
              )}

              {/* STEP 2: THERAPIST & TIME SLOT */}
              {step === 2 && (
                <motion.div
                  key="step-2"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  transition={{ duration: 0.2 }}
                  className="space-y-6"
                >
                  <div>
                    <h3 className="text-xl font-serif font-medium text-[#18221e]">
                      Select Licensed Specialist & Time Slot
                    </h3>
                    <p className="text-xs sm:text-sm text-[#716a5d] mt-1">
                      Choose your physical therapy provider and a convenient date at our Jhamsikhel clinic.
                    </p>
                  </div>

                  {/* Therapist Picker */}
                  <div className="space-y-3">
                    <label className="text-xs font-semibold uppercase tracking-wider text-[#716a5d] block">
                      Assigned Doctor
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                      {therapists.map((t) => {
                        const isSelected = selectedTherapist?.id === t.id;
                        return (
                          <div
                            key={t.id}
                            onClick={() => {
                              setSelectedTherapistId(t.id);
                              setSelectedSlot("");
                            }}
                            className={`p-3.5 rounded-xl border cursor-pointer transition-all text-left ${
                              isSelected
                                ? "bg-[#faf5ec] border-[#b8763a] shadow-xs"
                                : "bg-[#fdfcf9] border-[#e8dfcf] hover:border-[#cfc4b2]"
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              {t.image ? (
                                <div className="relative w-12 h-12 rounded-full overflow-hidden border border-[#d9d0be] shrink-0 bg-[#e8dfcf]">
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
                                <div className="w-12 h-12 rounded-full bg-[#132420] text-[#f0dfc7] font-serif font-bold text-sm flex items-center justify-center shrink-0">
                                  {t.name
                                    .split(" ")
                                    .map((p) => p[0])
                                    .slice(0, 2)
                                    .join("")}
                                </div>
                              )}
                              <div className="min-w-0">
                                <div className="text-xs font-bold text-[#18221e] truncate">
                                  {t.name}
                                </div>
                                <div className="text-[11px] text-[#716a5d] truncate">
                                  {t.specialty}
                                </div>
                                {t.nhpc_reg && (
                                  <div className="text-[10px] font-mono text-[#b8763a]">
                                    {t.nhpc_reg}
                                  </div>
                                )}
                              </div>
                            </div>
                            <div className="mt-2.5 pt-2 border-t border-[#f0e7d7] text-[10px] text-[#857d6f] flex justify-between items-center">
                              <span>{t.working_days}</span>
                              <span className="font-mono">{t.slot_duration}m</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Date Picker & Slots Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-6 pt-2">
                    <div className="md:col-span-4 space-y-2">
                      <label className="text-xs font-semibold uppercase tracking-wider text-[#716a5d] block">
                        Select Appointment Date
                      </label>
                      <input
                        type="date"
                        min={new Date().toISOString().slice(0, 10)}
                        value={selectedDate}
                        onChange={(e) => {
                          setSelectedDate(e.target.value);
                          setSelectedSlot("");
                        }}
                        className="w-full px-3.5 py-2.5 bg-white border border-[#d9d0be] rounded-xl text-sm font-medium text-[#18221e] focus:outline-hidden focus:border-[#b8763a] focus:ring-2 focus:ring-[#f0dfc7]"
                      />
                      {selectedTherapist && (
                        <p className="text-[11px] text-[#7a7263]">
                          Consultation days for {selectedTherapist.name}:{" "}
                          <span className="font-semibold text-[#18221e]">
                            {selectedTherapist.working_days}
                          </span>
                        </p>
                      )}
                    </div>

                    <div className="md:col-span-8 space-y-2">
                      <label className="text-xs font-semibold uppercase tracking-wider text-[#716a5d] block">
                        Available Consultation Slots
                      </label>

                      {loading ? (
                        <div className="p-8 text-center text-xs text-[#716a5d] bg-[#fbf9f4] rounded-xl border border-[#ede5d5]">
                          Loading live schedule...
                        </div>
                      ) : availableSlots.length === 0 ? (
                        <div className="p-8 text-center text-xs text-[#716a5d] bg-[#fbf9f4] rounded-xl border border-[#ede5d5] flex flex-col items-center gap-2">
                          <AlertCircle className="w-5 h-5 text-[#b8763a]" />
                          <span>
                            No open slots for {selectedTherapist?.name} on this date.
                            Please select another day or doctor.
                          </span>
                        </div>
                      ) : (
                        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 max-h-56 overflow-y-auto pr-1">
                          {availableSlots.map((slot) => {
                            const isSelected = selectedSlot === slot;
                            return (
                              <button
                                key={slot}
                                type="button"
                                onClick={() => setSelectedSlot(slot)}
                                className={`py-2 px-3 text-xs font-mono font-medium rounded-lg border transition-all ${
                                  isSelected
                                    ? "bg-[#b8763a] border-[#b8763a] text-white shadow-xs"
                                    : "bg-white border-[#ded5c2] text-[#18221e] hover:border-[#b8763a] hover:bg-[#faf5ec]"
                                }`}
                              >
                                {slot}
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="pt-4 flex justify-between items-center border-t border-[#eee7d8]">
                    <button
                      type="button"
                      onClick={() => setStep(1)}
                      className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-[#5c5446] hover:text-[#18221e] transition-colors"
                    >
                      <ArrowLeft className="w-3.5 h-3.5" />
                      Back to Programs
                    </button>

                    <button
                      type="button"
                      disabled={!selectedSlot}
                      onClick={() => setStep(3)}
                      className="inline-flex items-center gap-2 px-6 py-3 text-sm font-semibold text-white bg-[#b8763a] hover:bg-[#a3652e] disabled:opacity-40 disabled:cursor-not-allowed rounded-xl transition-all shadow-sm"
                    >
                      Next: Patient Details
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </motion.div>
              )}

              {/* STEP 3: PATIENT INFORMATION */}
              {step === 3 && (
                <motion.div
                  key="step-3"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  transition={{ duration: 0.2 }}
                  className="space-y-6"
                >
                  <div>
                    <h3 className="text-xl font-serif font-medium text-[#18221e]">
                      Patient Clinical Intake (Nepal)
                    </h3>
                    <p className="text-xs sm:text-sm text-[#716a5d] mt-1">
                      Enter your mobile number and medical details. Your mobile number acts as your lookup key
                      to inspect or modify your bookings.
                    </p>
                  </div>

                  <form onSubmit={handleBookingSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-[#554d40]">
                          First Name <span className="text-[#b5493b]">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          value={firstName}
                          onChange={(e) => setFirstName(e.target.value)}
                          placeholder="e.g. Sunita"
                          className="w-full px-3.5 py-2 bg-white border border-[#d9d0be] rounded-lg text-sm text-[#18221e] focus:outline-hidden focus:border-[#b8763a]"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-[#554d40]">
                          Last Name <span className="text-[#b5493b]">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          value={lastName}
                          onChange={(e) => setLastName(e.target.value)}
                          placeholder="e.g. Gurung"
                          className="w-full px-3.5 py-2 bg-white border border-[#d9d0be] rounded-lg text-sm text-[#18221e] focus:outline-hidden focus:border-[#b8763a]"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-[#554d40]">
                          Mobile Phone (Nepal +977) <span className="text-[#b5493b]">*</span>
                        </label>
                        <input
                          type="tel"
                          required
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          placeholder="+977 9841234567"
                          className="w-full px-3.5 py-2 bg-white border border-[#d9d0be] rounded-lg text-sm font-mono text-[#18221e] focus:outline-hidden focus:border-[#b8763a]"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-[#554d40]">
                          Email Address
                        </label>
                        <input
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="patient@gmail.com"
                          className="w-full px-3.5 py-2 bg-white border border-[#d9d0be] rounded-lg text-sm text-[#18221e] focus:outline-hidden focus:border-[#b8763a]"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-[#554d40]">
                          Address / Municipality
                        </label>
                        <input
                          type="text"
                          value={address}
                          onChange={(e) => setAddress(e.target.value)}
                          placeholder="e.g. Jhamsikhel, Lalitpur"
                          className="w-full px-3.5 py-2 bg-white border border-[#d9d0be] rounded-lg text-sm text-[#18221e] focus:outline-hidden focus:border-[#b8763a]"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-[#554d40]">
                          Date of Birth
                        </label>
                        <input
                          type="date"
                          value={dateOfBirth}
                          onChange={(e) => setDateOfBirth(e.target.value)}
                          className="w-full px-3.5 py-2 bg-white border border-[#d9d0be] rounded-lg text-sm text-[#18221e] focus:outline-hidden focus:border-[#b8763a]"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-[#554d40]">Gender</label>
                        <select
                          value={gender}
                          onChange={(e) => setGender(e.target.value)}
                          className="w-full px-3.5 py-2 bg-white border border-[#d9d0be] rounded-lg text-sm text-[#18221e] focus:outline-hidden focus:border-[#b8763a]"
                        >
                          <option>Female</option>
                          <option>Male</option>
                          <option>Other</option>
                        </select>
                      </div>

                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-[#554d40]">
                          Blood Group (Optional)
                        </label>
                        <input
                          type="text"
                          value={bloodGroup}
                          onChange={(e) => setBloodGroup(e.target.value)}
                          placeholder="e.g. O+, A+, B+"
                          className="w-full px-3.5 py-2 bg-white border border-[#d9d0be] rounded-lg text-sm text-[#18221e] focus:outline-hidden focus:border-[#b8763a]"
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-[#554d40]">
                        Known Allergies
                      </label>
                      <input
                        type="text"
                        value={allergies}
                        onChange={(e) => setAllergies(e.target.value)}
                        placeholder="e.g. Penicillin, Latex, None"
                        className="w-full px-3.5 py-2 bg-white border border-[#d9d0be] rounded-lg text-sm text-[#18221e] focus:outline-hidden focus:border-[#b8763a]"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-[#554d40]">
                        Medical Notes & Symptoms Description
                      </label>
                      <textarea
                        rows={2}
                        value={medicalNotes}
                        onChange={(e) => setMedicalNotes(e.target.value)}
                        placeholder="Briefly describe your pain location, sports injury, or orthopedic history..."
                        className="w-full px-3.5 py-2 bg-white border border-[#d9d0be] rounded-lg text-sm text-[#18221e] focus:outline-hidden focus:border-[#b8763a]"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-[#554d40]">
                          Payment Preference (Nepal)
                        </label>
                        <select
                          value={paymentMethod}
                          onChange={(e) => setPaymentMethod(e.target.value)}
                          className="w-full px-3.5 py-2 bg-white border border-[#d9d0be] rounded-lg text-sm text-[#18221e] focus:outline-hidden focus:border-[#b8763a]"
                        >
                          <option>Fonepay / QR Code</option>
                          <option>eSewa</option>
                          <option>Khalti</option>
                          <option>Cash at Reception</option>
                          <option>SCT / Visa Card</option>
                        </select>
                      </div>

                      {/* Summary box */}
                      <div className="p-3 bg-[#faf5ec] border border-[#e4d8c2] rounded-xl text-xs space-y-1 text-[#665e50]">
                        <div className="flex justify-between font-semibold text-[#18221e]">
                          <span>{selectedService.name}</span>
                          <span className="font-mono text-[#b8763a]">{selectedService.price_display}</span>
                        </div>
                        <div>
                          Doctor: <span className="font-medium text-[#18221e]">{selectedTherapist?.name}</span>
                        </div>
                        <div>
                          Slot: <span className="font-mono font-medium">{selectedDate} @ {selectedSlot}</span>
                        </div>
                      </div>
                    </div>

                    {submitError && (
                      <div className="p-3 bg-[#fbeaea] border border-[#f1c5c1] text-[#b5493b] text-xs rounded-lg">
                        {submitError}
                      </div>
                    )}

                    <div className="pt-4 flex justify-between items-center border-t border-[#eee7d8]">
                      <button
                        type="button"
                        onClick={() => setStep(2)}
                        className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-[#5c5446] hover:text-[#18221e] transition-colors"
                      >
                        <ArrowLeft className="w-3.5 h-3.5" />
                        Back to Schedule
                      </button>

                      <button
                        type="submit"
                        disabled={submitting}
                        className="inline-flex items-center gap-2 px-7 py-3 text-sm font-semibold text-white bg-[#b8763a] hover:bg-[#a3652e] disabled:opacity-50 rounded-xl transition-all shadow-md"
                      >
                        {submitting ? "Booking..." : "Confirm & Reserve Slot"}
                        <CheckCircle2 className="w-4 h-4" />
                      </button>
                    </div>
                  </form>
                </motion.div>
              )}

              {/* STEP 4: CONFIRMATION */}
              {step === 4 && confirmedBooking && (
                <motion.div
                  key="step-4"
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.3 }}
                  className="py-6 text-center max-w-xl mx-auto space-y-6"
                >
                  <div className="w-16 h-16 bg-[#e1ebe3] text-[#4f7c63] rounded-full flex items-center justify-center mx-auto shadow-xs">
                    <CheckCircle2 className="w-9 h-9" />
                  </div>

                  <div>
                    <h3 className="text-2xl font-serif font-medium text-[#18221e]">
                      Appointment Reserved!
                    </h3>
                    <p className="text-sm text-[#716a5d] mt-1">
                      Your consultation session is confirmed at our Jhamsikhel, Lalitpur clinic.
                    </p>
                  </div>

                  <div className="p-6 bg-[#faf7f0] border border-[#ded5c2] rounded-2xl text-left space-y-3">
                    <div className="flex justify-between items-center border-b border-[#e8ded0] pb-2.5">
                      <span className="text-xs text-[#716a5d]">Booking ID</span>
                      <span className="font-mono font-bold text-sm text-[#b8763a]">
                        PD-APT-{confirmedBooking.appointmentId}
                      </span>
                    </div>

                    <div className="flex justify-between items-center text-xs">
                      <span className="text-[#716a5d]">Patient</span>
                      <span className="font-semibold text-[#18221e]">
                        {confirmedBooking.patientName}
                      </span>
                    </div>

                    <div className="flex justify-between items-center text-xs">
                      <span className="text-[#716a5d]">Consulting Specialist</span>
                      <span className="font-semibold text-[#18221e]">
                        {confirmedBooking.therapistName}
                      </span>
                    </div>

                    <div className="flex justify-between items-center text-xs">
                      <span className="text-[#716a5d]">Date & Time</span>
                      <span className="font-mono font-semibold text-[#18221e]">
                        {confirmedBooking.date} at {confirmedBooking.time}
                      </span>
                    </div>

                    <div className="flex justify-between items-center text-xs">
                      <span className="text-[#716a5d]">Treatment & Fee</span>
                      <span className="font-medium text-[#18221e]">
                        {confirmedBooking.service} ({confirmedBooking.fee})
                      </span>
                    </div>

                    <div className="flex justify-between items-center text-xs pt-1 border-t border-[#e8ded0]">
                      <span className="text-[#716a5d]">Lookup Key</span>
                      <span className="font-mono text-[#554d40]">
                        {confirmedBooking.phone}
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
                    <a
                      href="#lookup"
                      className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 text-xs font-semibold text-[#18221e] bg-white border border-[#d9d0be] rounded-xl hover:bg-[#f3ede1] transition-all shadow-xs"
                    >
                      View in My Appointments
                    </a>

                    <button
                      type="button"
                      onClick={resetForm}
                      className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 text-xs font-semibold text-white bg-[#b8763a] rounded-xl hover:bg-[#a3652e] transition-all shadow-xs"
                    >
                      Book Another Session
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </section>
  );
}
