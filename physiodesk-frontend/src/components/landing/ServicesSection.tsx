"use client";

import { CheckCircle, ArrowRight, Award } from "lucide-react";

import { useEffect, useState } from "react";
import { api, ClinicService } from "@/lib/api";

export function ServicesSection() {
  const [services, setServices] = useState<ClinicService[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    api.services()
      .then((data) => {
        if (active) setServices(data);
      })
      .catch(() => {
        if (active) setServices([]);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

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

        {loading ? (
          <div className="py-12 text-center text-sm text-[#716a5d]">Loading services...</div>
        ) : services.length === 0 ? (
          <div className="py-12 text-center text-sm text-[#716a5d]">
            Services are currently being updated. Please check back soon.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {services.map((service, index) => (
              <div
                key={service.id}
                className="bg-white border border-[#ded5c2] rounded-2xl p-6 sm:p-7 shadow-xs flex flex-col justify-between"
              >
                <div>
                  <div className="flex justify-between items-center text-xs font-mono text-[#b8763a] font-semibold mb-2">
                    <span>Program {String(index + 1).padStart(2, "0")}</span>
                    <span className="text-[#857d6f] bg-[#faf5ec] border border-[#ebdcc4] px-2 py-0.5 rounded">
                      Typical Duration: {service.duration}
                    </span>
                  </div>
                  <h3 className="text-xl font-serif font-medium text-[#18221e]">
                    {service.name}
                  </h3>
                  <p className="text-xs text-[#716a5d] mt-1.5 font-medium">
                    {service.category && (
                      <>
                        {service.category}: {" "}
                      </>
                    )}
                    <span className="text-[#18221e]">{service.description}</span>
                  </p>

                  <div className="mt-4 pt-4 border-t border-[#f0e8da] space-y-2.5">
                    {(service.indications?.split(",").map((indication) => indication.trim()).filter(Boolean) ?? [
                      "Individualized assessment and treatment planning",
                    ]).map((indication) => (
                      <div key={indication} className="flex items-start gap-2 text-xs text-[#554d40]">
                        <CheckCircle className="w-3.5 h-3.5 text-[#4f7c63] mt-0.5 shrink-0" />
                        <span>{indication}</span>
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
        )}
      </div>
    </section>
  );
}
