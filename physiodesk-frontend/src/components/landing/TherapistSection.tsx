"use client";

import Image from "next/image";
import { Stethoscope, Clock, Calendar, ArrowRight, Award } from "lucide-react";

interface TherapistCardProps {
  name: string;
  specialty: string;
  reg: string;
  days: string;
  hours: string;
  notes: string;
  image?: string;
  slotDuration: number;
}

const THERAPISTS: TherapistCardProps[] = [
  {
    name: "Dr. Maya Thapa, MPT",
    specialty: "Sports Rehab & Musculoskeletal",
    reg: "NHPC Reg: 1421-PT",
    days: "Mon – Fri",
    hours: "09:00 – 17:00",
    slotDuration: 30,
    notes: "Specialist in sports trauma, post-ACL reconstruction protocols, trekking overuse injuries, and rotator cuff repairs.",
    image: "/images/therapist_maya_chen_1790344875896.jpg",
  },
  {
    name: "Dr. Bikash Shrestha, MPT",
    specialty: "Neurological Rehabilitation",
    reg: "NHPC Reg: 1109-PT",
    days: "Mon, Tue, Wed, Fri",
    hours: "08:30 – 16:30",
    slotDuration: 45,
    notes: "Specialist in stroke recovery, vestibular vertigo therapy, balance retraining, and neuromuscular gait recovery.",
    image: "/images/therapist_daniel_brooks_1790344888404.jpg",
  },
  {
    name: "Dr. Priya Sharma, MPT",
    specialty: "Posture, Spine & Mobility",
    reg: "NHPC Reg: 1530-PT",
    days: "Tue – Sat",
    hours: "10:00 – 18:00",
    slotDuration: 30,
    notes: "Ergonomics specialist, cervical decompression, scoliosis alignment, and core pelvic stability for IT professionals.",
    image: "/images/therapist_priya_shah_1790344899945.jpg",
  },
  {
    name: "Dr. Ritesh Adhikari, BPT",
    specialty: "Manual Therapy & Joint Orthopedics",
    reg: "NHPC Reg: 1845-PT",
    days: "Mon, Wed, Fri",
    hours: "12:00 – 18:00",
    slotDuration: 60,
    notes: "Deep tissue myofascial mobilization, post-knee replacement protocol (TKR), and kinetic joint manipulation.",
  },
];

export function TherapistSection() {
  return (
    <section id="therapists" className="py-16 md:py-24 bg-[#fbf9f4] border-b border-[#e5decb]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white border border-[#ded5c2] text-xs font-semibold text-[#5c3a17] mb-3">
            <Stethoscope className="w-3.5 h-3.5 text-[#b8763a]" />
            Licensed Clinical Team · Kathmandu & Lalitpur
          </div>
          <h2 className="text-3xl sm:text-4xl font-serif font-medium text-[#18221e] tracking-tight">
            Consult Our Senior Physiotherapists
          </h2>
          <p className="mt-2 text-sm text-[#716a5d]">
            Every patient is assigned to an accredited physical therapist registered with the Nepal Health
            Professional Council (NHPC), ensuring dedicated 1-on-1 care throughout recovery.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {THERAPISTS.map((t) => (
            <div
              key={t.name}
              className="bg-white border border-[#ded5c2] rounded-2xl overflow-hidden shadow-xs hover:shadow-md transition-all hover:border-[#cfc4b2] flex flex-col"
            >
              {/* Image / Portrait */}
              <div className="relative aspect-[4/3] w-full bg-[#f4ede1] border-b border-[#eee7d8]">
                {t.image ? (
                  <Image
                    src={t.image}
                    alt={t.name}
                    fill
                    sizes="(max-width: 768px) 100vw, 300px"
                    className="object-cover"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center bg-[#132420] text-[#f0dfc7]">
                    <div className="w-16 h-16 rounded-full bg-[#203a34] flex items-center justify-center font-serif text-2xl font-bold">
                      RA
                    </div>
                    <span className="text-xs text-[#a6b0ae] mt-2">Senior Specialist</span>
                  </div>
                )}
                <div className="absolute top-3 right-3 bg-[#132420]/80 backdrop-blur-xs text-[#f0dfc7] text-[10px] font-mono px-2 py-0.5 rounded-md">
                  {t.slotDuration} min slots
                </div>
              </div>

              {/* Content */}
              <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                <div>
                  <h3 className="text-base font-serif font-semibold text-[#18221e] leading-snug">
                    {t.name}
                  </h3>
                  <p className="text-xs font-medium text-[#b8763a] mt-0.5">{t.specialty}</p>
                  <p className="text-[10px] font-mono text-[#716a5d] mt-0.5 flex items-center gap-1">
                    <Award className="w-3 h-3 text-[#b8763a]" />
                    {t.reg}
                  </p>

                  <p className="text-xs text-[#6e675a] mt-3 leading-relaxed">{t.notes}</p>
                </div>

                <div className="pt-3 border-t border-[#f0e8da] space-y-1.5 text-xs text-[#716a5d]">
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5 text-[#857d6f]">
                      <Calendar className="w-3.5 h-3.5 text-[#b8763a]" />
                      Days:
                    </span>
                    <span className="font-semibold text-[#18221e]">{t.days}</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5 text-[#857d6f]">
                      <Clock className="w-3.5 h-3.5 text-[#b8763a]" />
                      Hours:
                    </span>
                    <span className="font-mono text-[#18221e]">{t.hours}</span>
                  </div>

                  <div className="pt-2">
                    <a
                      href="#book"
                      className="w-full inline-flex items-center justify-center gap-1.5 py-2 px-3 bg-[#faf5ec] hover:bg-[#b8763a] text-[#5c3a17] hover:text-white rounded-lg text-xs font-semibold transition-all border border-[#ebdcc4] hover:border-[#b8763a]"
                    >
                      Book with this Doctor
                      <ArrowRight className="w-3.5 h-3.5" />
                    </a>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
