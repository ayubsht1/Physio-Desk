import Link from "next/link";
import { Phone, Mail, MapPin, ArrowRight } from "lucide-react";

export function Footer() {
  return (
    <footer className="bg-[#132420] text-[#e0ded8] pt-14 pb-10 border-t border-[#233d36]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 pb-10 border-b border-[#233d36]">
          {/* Brand */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-[#b8763a] text-[#132420] flex items-center justify-center font-serif text-lg font-bold">
                P
              </div>
              <span className="font-serif text-xl font-medium text-[#f0dfc7]">
                Physio Desk
              </span>
            </div>
            <p className="text-xs text-[#a6b0ae] leading-relaxed">
              Modern clinical physical therapy practice specializing in musculoskeletal recovery,
              neurological restoration, and post-surgical rehabilitation.
            </p>
          </div>

          {/* Clinical Hours */}
          <div className="space-y-3">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-[#f0dfc7]">
              Clinic Hours
            </h4>
            <div className="text-xs space-y-1.5 text-[#a6b0ae]">
              <div className="flex justify-between">
                <span>Sunday – Friday:</span>
                <span className="font-mono text-white">07:30 – 18:30</span>
              </div>
              <div className="flex justify-between">
                <span>Saturday:</span>
                <span className="font-mono text-white">08:00 – 13:00</span>
              </div>
              <div className="flex justify-between">
                <span>Emergency:</span>
                <span className="text-[#f0dfc7] font-mono">24/7 On-Call</span>
              </div>
            </div>
          </div>

          {/* Contact & Location */}
          <div className="space-y-3">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-[#f0dfc7]">
              Location & Contact
            </h4>
            <div className="text-xs space-y-2 text-[#a6b0ae]">
              <div className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-[#b8763a] shrink-0 mt-0.5" />
                <span>Jhamsikhel-3, Lalitpur (Near St. Mary&apos;s), Kathmandu Valley, Nepal</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-[#b8763a] shrink-0" />
                <span>+977 1-5532100 / +977 9851023450</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-[#b8763a] shrink-0" />
                <span>care@physiodesk.np</span>
              </div>
            </div>
          </div>

          {/* Quick links & staff portal */}
          <div className="space-y-3">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-[#f0dfc7]">
              Portals & Services
            </h4>
            <ul className="text-xs space-y-2 text-[#a6b0ae]">
              <li>
                <a href="#book" className="hover:text-white transition-colors">
                  Schedule Online Session
                </a>
              </li>
              <li>
                <a href="#lookup" className="hover:text-white transition-colors">
                  Lookup My Appointments
                </a>
              </li>
              <li>
                <a href="#therapists" className="hover:text-white transition-colors">
                  Clinical Care Team
                </a>
              </li>
              <li className="pt-1">
                <Link
                  href="/dashboard"
                  className="inline-flex items-center gap-1.5 text-[#f0dfc7] hover:text-[#b8763a] font-semibold transition-colors"
                >
                  Doctor & Staff Workspace
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#7d8885]">
          <p>© {new Date().getFullYear()} Physio Desk Clinical Practice. All rights reserved.</p>
          <div className="flex items-center gap-6">
            <span>HIPAA Compliant Patient Intake</span>
            <span>Accredited Physical Therapy Facility</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
