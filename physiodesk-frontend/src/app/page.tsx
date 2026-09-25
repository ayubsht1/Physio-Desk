import { Header } from "@/components/landing/Header";
import { Hero } from "@/components/landing/Hero";
import { BookingSection } from "@/components/landing/BookingSection";
import { AppointmentLookup } from "@/components/landing/AppointmentLookup";
import { TherapistSection } from "@/components/landing/TherapistSection";
import { ServicesSection } from "@/components/landing/ServicesSection";
import { Footer } from "@/components/landing/Footer";

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col bg-[#fbf9f4] text-[#18221e]">
      <Header />
      <main className="flex-1">
        <Hero />
        <BookingSection />
        <AppointmentLookup />
        <TherapistSection />
        <ServicesSection />
      </main>
      <Footer />
    </div>
  );
}
