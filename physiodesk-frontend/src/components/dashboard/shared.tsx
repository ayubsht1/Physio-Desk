"use client";

import { X } from "lucide-react";
import type { Invoice } from "@/lib/api";

export function money(value: number) {
  return `Rs. ${Number(value || 0).toLocaleString("en-NP")}`;
}

export async function downloadInvoicePdf(invoice: Invoice) {
  const { jsPDF } = await import("jspdf");
  const document = new jsPDF();
  const subtotal = Number(invoice.subtotal ?? invoice.amount ?? 0);
  const discount = invoice.discount ?? 0;
  const total = Number(invoice.total ?? Math.max(subtotal - discount, 0));
  const invoiceNumber = invoice.invoice_number ?? `INV-${invoice.id}`;
  const serviceName = invoice.service ?? invoice.service_name ?? "Physiotherapy treatment";
  const fileName = invoiceNumber.replace(/[^a-z0-9_-]/gi, "_");

  document.setFillColor(19, 36, 32);
  document.rect(0, 0, 210, 38, "F");
  document.setTextColor(240, 223, 199);
  document.setFontSize(22);
  document.text("Physio Desk", 20, 18);
  document.setFontSize(10);
  document.text("Rehabilitation & Performance Clinic", 20, 27);

  document.setTextColor(24, 34, 30);
  document.setFontSize(16);
  document.text("INVOICE", 20, 58);
  document.setFontSize(10);
  document.text(`Invoice: ${invoiceNumber}`, 20, 67);
  document.text(`Date: ${invoice.invoice_date}`, 20, 74);
  document.text(`Status: ${invoice.status}`, 140, 67);

  document.setDrawColor(222, 213, 194);
  document.line(20, 84, 190, 84);
  document.setFontSize(11);
  document.text("Bill to", 20, 97);
  document.setFontSize(12);
  document.text(invoice.patient_name ?? "Patient", 20, 106);
  document.setFontSize(10);
  document.text(serviceName, 20, 116);

  document.line(20, 129, 190, 129);
  document.text("Description", 20, 140);
  document.text("Amount", 158, 140);
  document.line(20, 145, 190, 145);
  document.text(document.splitTextToSize(serviceName, 125), 20, 156);
  document.text(money(subtotal), 158, 156);
  document.text("Discount", 20, 167);
  document.text(`-${money(discount)}`, 158, 167);
  document.line(20, 174, 190, 174);
  document.setFontSize(12);
  document.text("Total", 20, 187);
  document.text(money(total), 158, 187);

  if (invoice.notes) {
    document.setFontSize(10);
    document.text("Notes", 20, 207);
    document.text(document.splitTextToSize(invoice.notes, 170), 20, 216);
  }

  document.setTextColor(113, 106, 93);
  document.setFontSize(9);
  document.text("Thank you for choosing Physio Desk.", 20, 278);
  document.save(`${fileName}.pdf`);
}

export function StatusBadge({ text }: { text: string }) {
  const isGood = ["Paid", "Active", "Completed", "Booked"].includes(text);
  const isBad = ["Overdue", "Cancelled", "Void", "No-show"].includes(text);

  const style = isBad
    ? "bg-[#fbeaea] text-[#b5493b] border-[#f1c5c1]"
    : isGood
    ? "bg-[#e1ebe3] text-[#3b664e] border-[#bed4c3]"
    : "bg-[#e7ebee] text-[#4a5568] border-[#cbd5e1]";

  return (
    <span
      className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-semibold tracking-wide border ${style}`}
    >
      {text}
    </span>
  );
}

export function Modal({
  title,
  children,
  onClose,
  maxWidth = "max-w-2xl",
}: {
  title: string;
  children: React.ReactNode;
  onClose: () => void;
  maxWidth?: string;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#132420]/60 backdrop-blur-xs"
      onClick={onClose}
    >
      <div
        className={`bg-white border border-[#ded5c2] rounded-2xl shadow-2xl w-full ${maxWidth} max-h-[90vh] overflow-y-auto`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#eee7d8] sticky top-0 bg-white z-10">
          <h3 className="text-lg font-serif font-semibold text-[#18221e]">{title}</h3>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-[#716a5d] hover:text-[#18221e] hover:bg-[#f4ede1] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}
