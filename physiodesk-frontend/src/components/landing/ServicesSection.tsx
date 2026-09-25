"use client";

import { CheckCircle, ArrowRight, Award } from "lucide-react";

const PROGRAMS = [
  {
    category: "Program 01",
    title: "Post-Surgical Joint Rehabilitation",
    indications: "Knee replacement, hip arthroscopy, rotator cuff repair, meniscus repairs",
    features: [
      "Range-of-motion restoration protocols starting at Week 1",
      "Neuromuscular stimulation & targeted edema reduction",
      "Objective digital goniometric milestone tracking",
    ],
    timeline: "8 – 16 Weeks",
  },
  {
    category: "Program 02",
    title: "Return-to-Sport & Athletic Performance",
    indications: "ACL reconstruction, high ankle syndesmosis, hamstring tears, tendonitis",
    features: [
      "Biomechanical motion capture & kinetic symmetry analysis",
      "Progressive eccentric loading and plyometric deceleration",
      "Triple hop testing and clearance protocols for competition",
    ],
    timeline: "6 – 12 Weeks",
  },
  {
    category: "Program 03",
    title: "Spine, Disc & Postural Decompression",
    indications: "L4-L5 herniated discs, cervical radiculopathy, chronic lower back spasms",
    features: [
      "Targeted mechanical decompression & neural flossing",
      "Deep transverse abdominis & multifidus core stabilization",
      "Ergonomic workplace kinetic consultation",
    ],
    timeline: "4 – 8 Weeks",
  },
  {
    category: "Program 04",
    title: "Neurological & Vestibular Balance",
    indications: "Post-stroke hemiparesis, benign paroxysmal positional vertigo (BPPV), gait instability",
    features: [
      "Canalith repositioning maneuvers for persistent vertigo",
      "Dynamic balance board & visual gaze stabilization drills",
      "Assisted over-ground gait training and fall prevention",
    ],
    timeline: "6 – 14 Weeks",
  },
];

export function ServicesSection() {
  return (
    <section id="services" className="py-16 md:py-24 bg-[#f4ede1] border-b border-[#e5decb]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white border border-[#ded5c2] text-xs font-semibold text-[#5c3a17] mb-3">
            <Award className="w-3.5 h-3.5 text-[#b8763a]" />
            Evidence-Based Care Pathways
          </div>
          <h2 className="text-3xl sm:text-4xl font-serif font-medium text-[#18221e] tracking-tight">
            Specialized Rehabilitation Programs
          </h2>
          <p className="mt-2 text-sm text-[#716a5d]">
            Structured clinical pathways designed by doctoral physical therapists to guide patients from
            acute impairment through full functional independence.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {PROGRAMS.map((p) => (
            <div
              key={p.title}
              className="bg-white border border-[#ded5c2] rounded-2xl p-6 sm:p-7 shadow-xs flex flex-col justify-between"
            >
              <div>
                <div className="flex justify-between items-center text-xs font-mono text-[#b8763a] font-semibold mb-2">
                  <span>{p.category}</span>
                  <span className="text-[#857d6f] bg-[#faf5ec] border border-[#ebdcc4] px-2 py-0.5 rounded">
                    Typical Duration: {p.timeline}
                  </span>
                </div>
                <h3 className="text-xl font-serif font-medium text-[#18221e]">
                  {p.title}
                </h3>
                <p className="text-xs text-[#716a5d] mt-1.5 font-medium">
                  Primary conditions: <span className="text-[#18221e]">{p.indications}</span>
                </p>

                <div className="mt-4 pt-4 border-t border-[#f0e8da] space-y-2.5">
                  {p.features.map((feat) => (
                    <div key={feat} className="flex items-start gap-2 text-xs text-[#554d40]">
                      <CheckCircle className="w-3.5 h-3.5 text-[#4f7c63] mt-0.5 shrink-0" />
                      <span>{feat}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-[#f0e8da] flex items-center justify-between">
                <span className="text-xs text-[#857d6f]">
                  Individualized 1-on-1 care
                </span>
                <a
                  href="#book"
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#b8763a] hover:text-[#a3652e]"
                >
                  Book Initial Session
                  <ArrowRight className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
