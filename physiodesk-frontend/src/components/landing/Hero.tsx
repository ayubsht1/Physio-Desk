"use client";

import Image from "next/image";
import { motion } from "motion/react";
import { Calendar, Search, CheckCircle2, Clock, MapPin, Award } from "lucide-react";

export function Hero() {
  return (
    <section className="relative overflow-hidden pt-8 pb-16 md:pt-14 md:pb-24 border-b border-[#e5decb]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          {/* Left Column */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="lg:col-span-7 space-y-6"
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#f0dfc7] text-[#5c3a17] text-xs font-semibold tracking-wide">
              <Award className="w-3.5 h-3.5 text-[#b8763a]" />
              Nepal Health Professional Council (NHPC) Accredited Facility
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-serif font-medium tracking-tight text-[#18221e] leading-[1.12]">
              Specialized Physical Therapy in Kathmandu Valley
            </h1>

            <p className="text-lg text-[#5c5446] leading-relaxed max-w-2xl">
              Evidence-based rehabilitation for sports injuries, post-surgical mobility, spinal
              decompression, and stroke recovery. Consult 1-on-1 with senior licensed physiotherapists at our
              Jhamsikhel, Lalitpur center.
            </p>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-2">
              <a
                href="#book"
                className="inline-flex items-center justify-center gap-2.5 px-6 py-3.5 text-sm font-semibold text-white bg-[#b8763a] hover:bg-[#a3652e] rounded-xl shadow-md transition-all hover:shadow-lg active:scale-[0.99]"
              >
                <Calendar className="w-4 h-4" />
                Book an Appointment (From Rs. 1,200)
              </a>
              <a
                href="#lookup"
                className="inline-flex items-center justify-center gap-2.5 px-6 py-3.5 text-sm font-semibold text-[#18221e] bg-white hover:bg-[#f5ede1] border border-[#d9d0be] rounded-xl transition-all shadow-xs"
              >
                <Search className="w-4 h-4 text-[#b8763a]" />
                Find My Appointments
              </a>
            </div>

            {/* Trust points */}
            <div className="pt-6 border-t border-[#e8e2d4] grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs text-[#5c5446]">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#4f7c63] shrink-0" />
                <span>Doctoral & MPT Qualified</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-[#4f7c63] shrink-0" />
                <span>Same-day slots available</span>
              </div>
              <div className="flex items-center gap-2 col-span-2 sm:col-span-1">
                <MapPin className="w-4 h-4 text-[#4f7c63] shrink-0" />
                <span>Jhamsikhel-3, Lalitpur</span>
              </div>
            </div>
          </motion.div>

          {/* Right Column: High-Fidelity Clinic Photo Card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="lg:col-span-5"
          >
            <div className="relative rounded-2xl overflow-hidden border border-[#d9d0be] bg-white shadow-xl">
              <div className="relative aspect-[4/3] w-full bg-[#eee7d8]">
                <Image
                  src="/images/physio_clinic_hero_1790344862877.jpg"
                  alt="Modern Physio Desk Rehabilitation Facility Kathmandu"
                  fill
                  sizes="(max-width: 768px) 100vw, 500px"
                  className="object-cover"
                  priority
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#132420]/80 via-transparent to-transparent" />
                <div className="absolute bottom-4 left-4 right-4 text-white">
                  <div className="text-xs uppercase tracking-wider text-[#f0dfc7] font-semibold mb-1">
                    Modern Clinical Center · Lalitpur
                  </div>
                  <p className="text-sm font-serif font-medium leading-snug">
                    Equipped with advanced electrotherapy, ultrasound, traction, and biomechanical rehab gym.
                  </p>
                </div>
              </div>

              {/* Quick Metrics Bar */}
              <div className="p-4 grid grid-cols-3 divide-x divide-[#e8e2d4] bg-white text-center">
                <div className="px-2">
                  <div className="text-xl font-serif font-bold text-[#18221e] tabular-nums">4</div>
                  <div className="text-[11px] text-[#716a5d] mt-0.5">NHPC Specialists</div>
                </div>
                <div className="px-2">
                  <div className="text-xl font-serif font-bold text-[#18221e] tabular-nums">98%</div>
                  <div className="text-[11px] text-[#716a5d] mt-0.5">Positive Outcome</div>
                </div>
                <div className="px-2">
                  <div className="text-xl font-serif font-bold text-[#18221e] tabular-nums">12k+</div>
                  <div className="text-[11px] text-[#716a5d] mt-0.5">Patients Treated</div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
