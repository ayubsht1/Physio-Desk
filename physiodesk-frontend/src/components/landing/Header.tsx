"use client";

import Link from "next/link";
import { Calendar, Search, Stethoscope, ArrowRight, ShieldCheck } from "lucide-react";

export function Header() {
  return (
    <header className="sticky top-0 z-40 bg-[#fbf9f4]/95 backdrop-blur-md border-b border-[#e5decb]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between gap-4">
        {/* Wordmark */}
        <Link href="/" className="flex items-center gap-3 group">
          <div className="w-10 h-10 rounded-xl bg-[#132420] text-[#f0dfc7] flex items-center justify-center font-serif text-xl font-bold transition-transform group-hover:scale-105">
            P
          </div>
          <div>
            <span className="text-xl font-serif font-semibold tracking-tight text-[#18221e] block">
              Physio Desk
            </span>
            <span className="text-[11px] text-[#716a5d] tracking-wide block -mt-0.5">
              Kathmandu, Nepal · NHPC Accredited Care
            </span>
          </div>
        </Link>

        {/* Navigation links */}
        <nav className="hidden md:flex items-center gap-7 text-sm font-medium text-[#5c5446]">
          <a
            href="#book"
            className="hover:text-[#18221e] transition-colors flex items-center gap-1.5"
          >
            <Calendar className="w-4 h-4 text-[#b8763a]" />
            Book Consultation
          </a>
          <a
            href="#lookup"
            className="hover:text-[#18221e] transition-colors flex items-center gap-1.5"
          >
            <Search className="w-4 h-4 text-[#b8763a]" />
            Find My Appointments
          </a>
          <a
            href="#therapists"
            className="hover:text-[#18221e] transition-colors flex items-center gap-1.5"
          >
            <Stethoscope className="w-4 h-4 text-[#b8763a]" />
            Specialist Doctors
          </a>
          <a
            href="#services"
            className="hover:text-[#18221e] transition-colors flex items-center gap-1.5"
          >
            <ShieldCheck className="w-4 h-4 text-[#b8763a]" />
            Treatments & Rates
          </a>
        </nav>

        {/* Primary Actions */}
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-[#132420] bg-white border border-[#d9d0be] rounded-lg hover:bg-[#f3ede1] transition-all shadow-xs"
          >
            Staff & Doctor Portal
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
          <a
            href="#book"
            className="hidden sm:inline-flex items-center justify-center px-4 py-2 text-xs font-semibold text-white bg-[#b8763a] rounded-lg hover:bg-[#a3652e] transition-all shadow-sm"
          >
            Book Session (NPR)
          </a>
        </div>
      </div>
    </header>
  );
}
