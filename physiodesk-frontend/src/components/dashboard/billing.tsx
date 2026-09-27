"use client";
import { useMemo, useState } from "react";
import { Plus, Download } from "lucide-react";
import { api, Invoice, InvoicePayload, Patient } from "@/lib/api";
import { money, downloadInvoicePdf, StatusBadge, Modal } from "@/components/dashboard/shared";

export function BillingTab({
  invoices,
  patients,
  onReload,
}: {
  invoices: Invoice[];
  patients: Patient[];
  onReload: () => Promise<void>;
}) {
  const [filter, setFilter] = useState("");
  const [isAdding, setIsAdding] = useState(false);

  const filtered = useMemo(() => {
    return invoices.filter((i) => !filter || i.status === filter);
  }, [invoices, filter]);

  return (
    <div className="space-y-4">
      <div className="bg-white border border-[#ded5c2] rounded-2xl p-4 shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="px-3 py-2 bg-[#fdfcf9] border border-[#d9d0be] rounded-xl text-xs text-[#18221e] focus:outline-hidden max-w-xs"
        >
          <option value="">All Invoice Statuses</option>
          <option>Paid</option>
          <option>Due</option>
          <option>Void</option>
        </select>

        <button
          onClick={() => setIsAdding(true)}
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#b8763a] hover:bg-[#a3652e] text-white text-xs font-semibold rounded-xl shadow-xs transition-colors shrink-0"
        >
          <Plus className="w-4 h-4" />
          Create Invoice
        </button>
      </div>

      <div className="bg-white border border-[#ded5c2] rounded-2xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-[#fcfaf5] text-[#716a5d] uppercase tracking-wider text-[10px] border-b border-[#eee7d8]">
                <th className="py-3 px-4 font-semibold">Patient</th>
                <th className="py-3 px-4 font-semibold">Service</th>
                <th className="py-3 px-4 font-semibold">Date</th>
                <th className="py-3 px-4 font-semibold">Amount</th>
                <th className="py-3 px-4 font-semibold">Status</th>
                <th className="py-3 px-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#f0e8da]">
              {filtered.map((inv) => (
                <tr key={inv.id} className="hover:bg-[#faf7f0]">
                  <td className="py-3 px-4 font-bold text-[#18221e]">
                    {inv.patient_name}
                  </td>
                  <td className="py-3 px-4 text-[#554d40]">{inv.service}</td>
                  <td className="py-3 px-4 font-mono text-[#716a5d]">{inv.invoice_date}</td>
                  <td className="py-3 px-4 font-mono font-bold text-[#18221e]">
                    {money(inv.amount - inv.discount)}
                  </td>
                  <td className="py-3 px-4">
                    <StatusBadge text={inv.status} />
                  </td>
                  <td className="py-3 px-4 text-right">
                    <button
                      type="button"
                      title="Download invoice PDF"
                      aria-label={`Download invoice ${inv.invoice_number ?? inv.id} as PDF`}
                      onClick={() => downloadInvoicePdf(inv)}
                      className="inline-flex items-center justify-center p-1.5 mr-2 text-[#554d40] hover:text-[#b8763a] hover:bg-[#fbf4e8] rounded-lg transition-colors"
                    >
                      <Download className="w-4 h-4" />
                    </button>
                    {inv.status === "Due" && (
                      <button
                        onClick={async () => {
                          await api.updateInvoice(inv.id, {
                            patient_id: inv.patient_id,
                            service: inv.service,
                            invoice_date: inv.invoice_date,
                            amount: inv.amount,
                            discount: inv.discount,
                            status: "Paid",
                          });
                          await onReload();
                        }}
                        className="px-2.5 py-1 bg-[#e1ebe3] hover:bg-[#bed4c3] text-[#2c533c] text-[11px] font-semibold rounded-lg transition-colors"
                      >
                        Mark as Paid
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <div className="p-8 text-center text-xs text-[#716a5d]">
              No invoices match this filter criteria.
            </div>
          )}
        </div>
      </div>

      {isAdding && (
        <InvoiceFormModal
          patients={patients}
          onClose={() => setIsAdding(false)}
          onSave={async (payload) => {
            await api.createInvoice(payload);
            setIsAdding(false);
            await onReload();
          }}
        />
      )}
    </div>
  );
}

function InvoiceFormModal({
  patients,
  onClose,
  onSave,
}: {
  patients: Patient[];
  onClose: () => void;
  onSave: (payload: InvoicePayload) => Promise<void>;
}) {
  const [patientId, setPatientId] = useState<number>(patients[0]?.id ?? 0);
  const [service, setService] = useState("Rehabilitation Treatment Session");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [amount, setAmount] = useState(1500);
  const [discount, setDiscount] = useState(0);
  const [status, setStatus] = useState<InvoicePayload["status"]>("Due");
  const [paymentMethod, setPaymentMethod] = useState("Fonepay / QR");
  const [busy, setBusy] = useState(false);

  return (
    <Modal title="Generate Patient Invoice" onClose={onClose}>
      <form
        onSubmit={async (e) => {
          e.preventDefault();
          setBusy(true);
          await onSave({
            patient_id: patientId,
            service,
            invoice_date: date,
            amount: Number(amount),
            discount: Number(discount),
            status,
            payment_method: paymentMethod,
          });
          setBusy(false);
        }}
        className="space-y-4 text-xs"
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          <div className="space-y-1">
            <label className="font-semibold text-[#554d40]">Patient</label>
            <select
              value={patientId}
              onChange={(e) => setPatientId(Number(e.target.value))}
              className="w-full px-3 py-2 bg-[#fdfcf9] border border-[#d9d0be] rounded-lg text-sm text-[#18221e]"
            >
              {patients.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <label className="font-semibold text-[#554d40]">Invoice Date</label>
            <input
              type="date"
              required
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-3 py-2 bg-[#fdfcf9] border border-[#d9d0be] rounded-lg text-sm text-[#18221e]"
            />
          </div>

          <div className="space-y-1 sm:col-span-2">
            <label className="font-semibold text-[#554d40]">Clinical Service Description</label>
            <input
              required
              value={service}
              onChange={(e) => setService(e.target.value)}
              className="w-full px-3 py-2 bg-[#fdfcf9] border border-[#d9d0be] rounded-lg text-sm text-[#18221e]"
            />
          </div>

          <div className="space-y-1">
            <label className="font-semibold text-[#554d40]">Amount (Rs. / NPR)</label>
            <input
              type="number"
              min="0"
              required
              value={amount}
              onChange={(e) => setAmount(Number(e.target.value))}
              className="w-full px-3 py-2 bg-[#fdfcf9] border border-[#d9d0be] rounded-lg text-sm text-[#18221e]"
            />
          </div>

          <div className="space-y-1">
            <label className="font-semibold text-[#554d40]">Discount (Rs.)</label>
            <input
              type="number"
              min="0"
              value={discount}
              onChange={(e) => setDiscount(Number(e.target.value))}
              className="w-full px-3 py-2 bg-[#fdfcf9] border border-[#d9d0be] rounded-lg text-sm text-[#18221e]"
            />
          </div>

          <div className="space-y-1">
            <label className="font-semibold text-[#554d40]">Invoice Status</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as InvoicePayload["status"])}
              className="w-full px-3 py-2 bg-[#fdfcf9] border border-[#d9d0be] rounded-lg text-sm text-[#18221e]"
            >
              <option>Due</option>
              <option>Paid</option>
              <option>Void</option>
            </select>
          </div>

          <div className="space-y-1">
            <label className="font-semibold text-[#554d40]">Payment Method (Nepal)</label>
            <select
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
              className="w-full px-3 py-2 bg-[#fdfcf9] border border-[#d9d0be] rounded-lg text-sm text-[#18221e]"
            >
              <option>Fonepay / QR</option>
              <option>eSewa</option>
              <option>Khalti</option>
              <option>Cash</option>
              <option>Card (SCT / Visa)</option>
            </select>
          </div>
        </div>

        <div className="flex justify-end gap-2.5 pt-4 border-t border-[#eee7d8]">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-[#554d40] bg-[#f4ede1] rounded-xl"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={busy}
            className="px-5 py-2 text-xs font-semibold text-white bg-[#b8763a] rounded-xl"
          >
            {busy ? "Saving..." : "Create Invoice"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
