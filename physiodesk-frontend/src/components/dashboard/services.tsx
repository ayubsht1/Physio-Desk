"use client";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { Plus, Search, Trash2, Edit2, Sparkles } from "lucide-react";
import { api, ClinicService, Role, ServicePayload } from "@/lib/api";
import { money, StatusBadge, Modal } from "@/components/dashboard/shared";

export function ServicesTab({
  role,
  onReload,
}: {
  role: Role;
  onReload: () => Promise<void>;
}) {
  const [services, setServices] = useState<ClinicService[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [isAdding, setIsAdding] = useState(false);
  const [editingService, setEditingService] = useState<ClinicService | null>(null);
  const [actionBusyId, setActionBusyId] = useState<number | null>(null);

  const fetchServices = async () => {
    try {
      const data = await api.services({ include_inactive: true });
      setServices(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load clinic services");
    }
  };

  useEffect(() => {
    let active = true;
    api.services({ include_inactive: true })
      .then((data) => {
        if (!active) return;
        setServices(data);
        setLoading(false);
      })
      .catch((err) => {
        if (!active) return;
        setError(err instanceof Error ? err.message : "Failed to load clinic services");
        setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const categories = useMemo(() => {
    const set = new Set<string>();
    services.forEach((s) => {
      if (s.category) set.add(s.category);
    });
    return ["All", ...Array.from(set)];
  }, [services]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return services.filter((s) => {
      const matchesSearch =
        !q ||
        s.name.toLowerCase().includes(q) ||
        s.category.toLowerCase().includes(q) ||
        (s.indications && s.indications.toLowerCase().includes(q)) ||
        (s.description && s.description.toLowerCase().includes(q));
      const matchesCategory = categoryFilter === "All" || s.category === categoryFilter;
      return matchesSearch && matchesCategory;
    });
  }, [services, search, categoryFilter]);

  const handleToggleActive = async (s: ClinicService) => {
    setActionBusyId(s.id);
    try {
      await api.updateService(s.id, { is_active: !s.is_active });
      await fetchServices();
      await onReload();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update service status");
    } finally {
      setActionBusyId(null);
    }
  };

  const handleDelete = async (s: ClinicService) => {
    if (!confirm(`Are you sure you want to remove the service "${s.name}"?`)) return;
    setActionBusyId(s.id);
    try {
      await api.deleteService(s.id);
      await fetchServices();
      await onReload();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete service");
    } finally {
      setActionBusyId(null);
    }
  };

  return (
    <div className="space-y-4">
      {/* Top Banner / Toolbar */}
      <div className="bg-white border border-[#ded5c2] rounded-2xl p-4 shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-serif font-bold text-[#18221e] flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-[#b8763a]" />
            Clinical Services & Treatment Directory
          </h3>
          <p className="text-xs text-[#716a5d] mt-0.5">
            Configure therapies, consultation session fees (NPR), and booking categories for the patient portal.
          </p>
        </div>

        {role === "admin" && (
          <button
            onClick={() => setIsAdding(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#b8763a] hover:bg-[#a3652e] text-white text-xs font-semibold rounded-xl shadow-xs transition-colors shrink-0"
          >
            <Plus className="w-4 h-4" />
            Add New Service
          </button>
        )}
      </div>

      {error && (
        <div className="p-3 bg-[#fbeaea] border border-[#f1c5c1] text-[#b5493b] text-xs rounded-xl flex items-center justify-between">
          <span>{error}</span>
          <button onClick={fetchServices} className="underline font-bold">
            Retry
          </button>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white border border-[#ded5c2] rounded-2xl p-4 shadow-xs flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        <div className="relative flex-1 max-w-sm">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#857d6f]" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search service by name, condition, or tag..."
            className="w-full pl-9 pr-3 py-1.5 bg-[#fdfcf9] border border-[#d9d0be] rounded-xl text-xs text-[#18221e] focus:outline-hidden focus:border-[#b8763a]"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
          <span className="text-[11px] font-semibold text-[#857d6f] shrink-0 uppercase tracking-wider">
            Category:
          </span>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-3 py-1.5 bg-[#fdfcf9] border border-[#d9d0be] rounded-xl text-xs font-medium text-[#18221e] focus:outline-hidden focus:border-[#b8763a]"
          >
            {categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Services Table */}
      <div className="bg-white border border-[#ded5c2] rounded-2xl overflow-hidden shadow-xs">
        {loading ? (
          <div className="p-8 text-center text-xs text-[#716a5d]">Loading clinical services...</div>
        ) : filtered.length === 0 ? (
          <div className="p-8 text-center text-xs text-[#716a5d]">
            No clinical services matched your search criteria.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#faf7f0] border-b border-[#ebdcc4] text-[#716a5d] uppercase tracking-wider text-[10px] font-bold">
                <tr>
                  <th className="py-3 px-4">Service & Clinical Focus</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Duration</th>
                  <th className="py-3 px-4">Fee (NPR)</th>
                  <th className="py-3 px-4">Indications</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#eee7d8]">
                {filtered.map((s) => (
                  <tr key={s.id} className="hover:bg-[#faf7f0]/60 transition-colors">
                    <td className="py-3 px-4 max-w-xs">
                      <div className="font-semibold text-[#18221e]">{s.name}</div>
                      {s.description && (
                        <div className="text-[11px] text-[#716a5d] line-clamp-1 mt-0.5">
                          {s.description}
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <span className="inline-block px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-[#f5ede1] text-[#5c3a17] border border-[#e4d8c2]">
                        {s.category}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono text-[#554d40]">{s.duration}</td>
                    <td className="py-3 px-4 font-mono font-bold text-[#b8763a]">
                      {s.price_display || money(s.price)}
                    </td>
                    <td className="py-3 px-4 max-w-xs text-[#554d40]">
                      <span className="line-clamp-1">{s.indications || "General musculoskeletal"}</span>
                    </td>
                    <td className="py-3 px-4">
                      <StatusBadge text={s.is_active ? "Active" : "On hold"} />
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => setEditingService(s)}
                          className="p-1.5 text-[#716a5d] hover:text-[#18221e] hover:bg-[#f4ede1] rounded-lg transition-colors"
                          title="Edit Service"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          disabled={actionBusyId === s.id}
                          onClick={() => handleToggleActive(s)}
                          className={`px-2 py-1 text-[10px] font-semibold rounded-md border transition-colors ${
                            s.is_active
                              ? "text-[#b5493b] border-[#f1c5c1] hover:bg-[#fbeaea]"
                              : "text-[#3b664e] border-[#bed4c3] hover:bg-[#e1ebe3]"
                          }`}
                        >
                          {s.is_active ? "Deactivate" : "Activate"}
                        </button>
                        {role === "admin" && (
                          <button
                            disabled={actionBusyId === s.id}
                            onClick={() => handleDelete(s)}
                            className="p-1.5 text-[#b5493b] hover:bg-[#fbeaea] rounded-lg transition-colors"
                            title="Delete Service"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Modal */}
      {isAdding && (
        <ServiceFormModal
          onClose={() => setIsAdding(false)}
          onSave={async (payload) => {
            await api.createService(payload);
            setIsAdding(false);
            await fetchServices();
            await onReload();
          }}
        />
      )}

      {/* Edit Modal */}
      {editingService && (
        <ServiceFormModal
          initial={editingService}
          onClose={() => setEditingService(null)}
          onSave={async (payload) => {
            await api.updateService(editingService.id, payload);
            setEditingService(null);
            await fetchServices();
            await onReload();
          }}
        />
      )}
    </div>
  );
}

function ServiceFormModal({
  initial,
  onClose,
  onSave,
}: {
  initial?: ClinicService;
  onClose: () => void;
  onSave: (payload: ServicePayload) => Promise<void>;
}) {
  const [name, setName] = useState(initial?.name ?? "");
  const [category, setCategory] = useState(initial?.category ?? "Sports Rehab");
  const [duration, setDuration] = useState(initial?.duration ?? "45 min");
  const [price, setPrice] = useState<string>(initial?.price ? String(initial.price) : "1500");  const [indications, setIndications] = useState(initial?.indications ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [isActive, setIsActive] = useState(initial?.is_active ?? true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      await onSave({
        name: name.trim(),
        category: category.trim(),
        duration: String(duration).trim(), // Fixed here
        price: Number(String(price).trim()),
        indications: indications.trim(),
        description: description.trim(),
        is_active: isActive,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save clinical service");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal title={initial ? "Edit Clinical Service" : "Register New Clinical Service"} onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4 text-xs">
        <div className="space-y-1">
          <label className="font-semibold text-[#554d40]">Service Name *</label>
          <input
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Sports Injury & ACL Rehabilitation"
            className="w-full px-3 py-2 bg-[#fdfcf9] border border-[#d9d0be] rounded-lg text-sm text-[#18221e] focus:outline-hidden focus:border-[#b8763a]"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="space-y-1">
            <label className="font-semibold text-[#554d40]">Category *</label>
            <input
              required
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              placeholder="e.g. Sports Rehab, Spine & Joint"
              className="w-full px-3 py-2 bg-[#fdfcf9] border border-[#d9d0be] rounded-lg text-sm text-[#18221e] focus:outline-hidden focus:border-[#b8763a]"
            />
          </div>

          <div className="space-y-1">
            <label className="font-semibold text-[#554d40]">Duration *</label>
            <input
              required
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
              placeholder="e.g. 45 min, 60 min"
              className="w-full px-3 py-2 bg-[#fdfcf9] border border-[#d9d0be] rounded-lg text-sm text-[#18221e] focus:outline-hidden focus:border-[#b8763a]"
            />
          </div>

          <div className="space-y-1">
            <label className="font-semibold text-[#554d40]">Fee in NPR (Rs.) *</label>
            <input
              type="number"
              min="0"
              required
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="1500"
              className="w-full px-3 py-2 bg-[#fdfcf9] border border-[#d9d0be] rounded-lg text-sm text-[#18221e] focus:outline-hidden focus:border-[#b8763a]"
            />
          </div>
        </div>

        <div className="space-y-1">
          <label className="font-semibold text-[#554d40]">
            Clinical Indications / Symptoms Addressed
          </label>
          <input
            value={indications}
            onChange={(e) => setIndications(e.target.value)}
            placeholder="e.g. ACL tear, Meniscus sprain, Ankle instability"
            className="w-full px-3 py-2 bg-[#fdfcf9] border border-[#d9d0be] rounded-lg text-sm text-[#18221e] focus:outline-hidden focus:border-[#b8763a]"
          />
        </div>

        <div className="space-y-1">
          <label className="font-semibold text-[#554d40]">Clinical Description & Treatment Protocol</label>
          <textarea
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Targeted protocol with kinetic evaluation, manual mobilization, neuromuscular stim..."
            className="w-full px-3 py-2 bg-[#fdfcf9] border border-[#d9d0be] rounded-lg text-sm text-[#18221e] focus:outline-hidden focus:border-[#b8763a]"
          />
        </div>

        <div className="flex items-center gap-2 pt-1">
          <input
            type="checkbox"
            id="service-active"
            checked={isActive}
            onChange={(e) => setIsActive(e.target.checked)}
            className="w-4 h-4 rounded text-[#b8763a] focus:ring-0"
          />
          <label htmlFor="service-active" className="text-xs font-semibold text-[#18221e] cursor-pointer">
            Service Active and available in Online Patient Booking
          </label>
        </div>

        {error && (
          <div className="p-3 bg-[#fbeaea] border border-[#f1c5c1] text-[#b5493b] text-xs rounded-lg">
            {error}
          </div>
        )}

        <div className="flex justify-end gap-2.5 pt-4 border-t border-[#eee7d8]">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-[#554d40] bg-[#f4ede1] hover:bg-[#eae1d0] rounded-xl transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={busy}
            className="px-5 py-2 text-xs font-semibold text-white bg-[#b8763a] hover:bg-[#a3652e] disabled:opacity-50 rounded-xl transition-colors shadow-xs"
          >
            {busy ? "Saving..." : initial ? "Update Service" : "Add Service"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
