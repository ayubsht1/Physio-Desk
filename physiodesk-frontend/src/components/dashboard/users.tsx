"use client";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { Plus, Search, Trash2, Edit2, UserCog, ShieldCheck, UserCheck } from "lucide-react";
import { api, Role, User, UserPayload } from "@/lib/api";
import { StatusBadge, Modal } from "@/components/dashboard/shared";

export function UsersTab({
  role,
  currentUser,
  onReload,
}: {
  role: Role;
  currentUser: User;
  onReload: () => Promise<void>;
}) {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("All");
  const [isAdding, setIsAdding] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [actionBusyId, setActionBusyId] = useState<number | null>(null);

  const fetchUsers = async () => {
    try {
      const data = await api.users();
      setUsers(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load clinic personnel accounts");
    }
  };

  useEffect(() => {
    let active = true;
    api.users()
      .then((data) => {
        if (!active) return;
        setUsers(data);
        setLoading(false);
      })
      .catch((err) => {
        if (!active) return;
        setError(err instanceof Error ? err.message : "Failed to load clinic personnel accounts");
        setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return users.filter((u) => {
      const matchesSearch =
        !q ||
        u.full_name.toLowerCase().includes(q) ||
        u.username.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        (u.phone && u.phone.toLowerCase().includes(q));
      const matchesRole = roleFilter === "All" || u.role === roleFilter;
      return matchesSearch && matchesRole;
    });
  }, [users, search, roleFilter]);

  const handleToggleActive = async (u: User) => {
    if (u.id === 1) {
      alert("Cannot deactivate the primary root administrator account.");
      return;
    }
    setActionBusyId(u.id);
    try {
      await api.updateUser(u.id, { is_active: !u.is_active });
      await fetchUsers();
      await onReload();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update user status");
    } finally {
      setActionBusyId(null);
    }
  };

  const handleDelete = async (u: User) => {
    if (u.id === 1) {
      alert("Cannot delete the primary root administrator account.");
      return;
    }
    if (u.id === currentUser.id) {
      alert("You cannot delete your own active administrator account.");
      return;
    }
    if (!confirm(`Are you sure you want to delete user account "${u.full_name}" (@${u.username})?`)) {
      return;
    }
    setActionBusyId(u.id);
    try {
      await api.deleteUser(u.id);
      await fetchUsers();
      await onReload();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete user");
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
            <UserCog className="w-4 h-4 text-[#b8763a]" />
            User & Staff Access Management
          </h3>
          <p className="text-xs text-[#716a5d] mt-0.5">
            Administer staff roles, credentials, and clinic access permissions in Nepal.
          </p>
        </div>

        {role === "admin" && (
          <button
            onClick={() => setIsAdding(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#b8763a] hover:bg-[#a3652e] text-white text-xs font-semibold rounded-xl shadow-xs transition-colors shrink-0"
          >
            <Plus className="w-4 h-4" />
            Add Clinic User
          </button>
        )}
      </div>

      {error && (
        <div className="p-3 bg-[#fbeaea] border border-[#f1c5c1] text-[#b5493b] text-xs rounded-xl flex items-center justify-between">
          <span>{error}</span>
          <button onClick={fetchUsers} className="underline font-bold">
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
            placeholder="Search user by name, username, email, or phone..."
            className="w-full pl-9 pr-3 py-1.5 bg-[#fdfcf9] border border-[#d9d0be] rounded-xl text-xs text-[#18221e] focus:outline-hidden focus:border-[#b8763a]"
          />
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[11px] font-semibold text-[#857d6f] uppercase tracking-wider">
            Role:
          </span>
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="px-3 py-1.5 bg-[#fdfcf9] border border-[#d9d0be] rounded-xl text-xs font-medium text-[#18221e] focus:outline-hidden focus:border-[#b8763a]"
          >
            <option value="All">All Roles</option>
            <option value="admin">Administrator</option>
            <option value="staff">Clinic Staff</option>
          </select>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white border border-[#ded5c2] rounded-2xl overflow-hidden shadow-xs">
        {loading ? (
          <div className="p-8 text-center text-xs text-[#716a5d]">Loading clinic users...</div>
        ) : filtered.length === 0 ? (
          <div className="p-8 text-center text-xs text-[#716a5d]">
            No user accounts found matching your search.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#faf7f0] border-b border-[#ebdcc4] text-[#716a5d] uppercase tracking-wider text-[10px] font-bold">
                <tr>
                  <th className="py-3 px-4">User Profile</th>
                  <th className="py-3 px-4">Username</th>
                  <th className="py-3 px-4">Contact (Nepal)</th>
                  <th className="py-3 px-4">Role</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Created Date</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#eee7d8]">
                {filtered.map((u) => {
                  const initials = u.full_name
                    .split(" ")
                    .map((n) => n[0])
                    .join("")
                    .slice(0, 2)
                    .toUpperCase();

                  const isRootAdmin = u.id === 1;
                  const isCurrent = u.id === currentUser.id;

                  return (
                    <tr key={u.id} className="hover:bg-[#faf7f0]/60 transition-colors">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-[#132420] text-[#f0dfc7] font-bold text-xs flex items-center justify-center shrink-0">
                            {initials}
                          </div>
                          <div>
                            <div className="font-semibold text-[#18221e] flex items-center gap-1.5">
                              {u.full_name}
                              {isCurrent && (
                                <span className="text-[10px] font-mono text-[#b8763a] font-normal">
                                  (You)
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-[#716a5d]">{u.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4 font-mono font-medium text-[#554d40]">
                        @{u.username}
                      </td>
                      <td className="py-3 px-4">
                        <div className="text-[#18221e] font-mono text-[11px]">
                          {u.phone || "—"}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        {u.role === "admin" ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[#f0dfc7] text-[#5c3a17] border border-[#d8c3a5]">
                            <ShieldCheck className="w-3 h-3 text-[#b8763a]" />
                            Administrator
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-[#e7ebee] text-[#4a5568] border border-[#cbd5e1]">
                            <UserCheck className="w-3 h-3 text-[#4a5568]" />
                            Clinic Staff
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <StatusBadge text={u.is_active ? "Active" : "Inactive"} />
                      </td>
                      <td className="py-3 px-4 font-mono text-[#716a5d] text-[11px]">
                        {u.created_at || "—"}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => setEditingUser(u)}
                            className="p-1.5 text-[#716a5d] hover:text-[#18221e] hover:bg-[#f4ede1] rounded-lg transition-colors"
                            title="Edit User"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          {!isRootAdmin && (
                            <button
                              disabled={actionBusyId === u.id}
                              onClick={() => handleToggleActive(u)}
                              className={`px-2 py-1 text-[10px] font-semibold rounded-md border transition-colors ${
                                u.is_active
                                  ? "text-[#b5493b] border-[#f1c5c1] hover:bg-[#fbeaea]"
                                  : "text-[#3b664e] border-[#bed4c3] hover:bg-[#e1ebe3]"
                              }`}
                            >
                              {u.is_active ? "Deactivate" : "Activate"}
                            </button>
                          )}
                          {!isRootAdmin && !isCurrent && (
                            <button
                              disabled={actionBusyId === u.id}
                              onClick={() => handleDelete(u)}
                              className="p-1.5 text-[#b5493b] hover:bg-[#fbeaea] rounded-lg transition-colors"
                              title="Delete User"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add User Modal */}
      {isAdding && (
        <UserFormModal
          onClose={() => setIsAdding(false)}
          onSave={async (payload) => {
            await api.createUser(payload);
            setIsAdding(false);
            await fetchUsers();
            await onReload();
          }}
        />
      )}

      {/* Edit User Modal */}
      {editingUser && (
        <UserFormModal
          initial={editingUser}
          onClose={() => setEditingUser(null)}
          onSave={async (payload) => {
            await api.updateUser(editingUser.id, payload);
            setEditingUser(null);
            await fetchUsers();
            await onReload();
          }}
        />
      )}
    </div>
  );
}

function UserFormModal({
  initial,
  onClose,
  onSave,
}: {
  initial?: User;
  onClose: () => void;
  onSave: (payload: UserPayload) => Promise<void>;
}) {
  const [fullName, setFullName] = useState(initial?.full_name ?? "");
  const [username, setUsername] = useState(initial?.username ?? "");
  const [email, setEmail] = useState(initial?.email ?? "");
  const [phone, setPhone] = useState(initial?.phone ?? "+977 98");
  const [role, setRole] = useState<Role>(initial?.role ?? "staff");
  const [password, setPassword] = useState("");
  const [isActive, setIsActive] = useState(initial?.is_active ?? true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError("");

    try {
      const payload: UserPayload = {
        full_name: fullName.trim(),
        username: username.trim().toLowerCase(),
        email: email.trim().toLowerCase(),
        phone: phone.trim() || null,
        role,
        is_active: isActive,
      };

      if (password.trim()) {
        payload.password = password.trim();
      } else if (!initial) {
        payload.password = "welcome123";
      }

      await onSave(payload);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save user account");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal title={initial ? "Edit Staff User Account" : "Register New Clinic User"} onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4 text-xs">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          <div className="space-y-1 sm:col-span-2">
            <label className="font-semibold text-[#554d40]">Full Name *</label>
            <input
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="e.g. Dr. Ayush Shrestha, PT"
              className="w-full px-3 py-2 bg-[#fdfcf9] border border-[#d9d0be] rounded-lg text-sm text-[#18221e] focus:outline-hidden focus:border-[#b8763a]"
            />
          </div>

          <div className="space-y-1">
            <label className="font-semibold text-[#554d40]">Username *</label>
            <input
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="e.g. ashrestha"
              className="w-full px-3 py-2 bg-[#fdfcf9] border border-[#d9d0be] rounded-lg text-sm text-[#18221e] focus:outline-hidden focus:border-[#b8763a]"
            />
          </div>

          <div className="space-y-1">
            <label className="font-semibold text-[#554d40]">Email Address *</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="ayush@physiodesk.np"
              className="w-full px-3 py-2 bg-[#fdfcf9] border border-[#d9d0be] rounded-lg text-sm text-[#18221e] focus:outline-hidden focus:border-[#b8763a]"
            />
          </div>

          <div className="space-y-1">
            <label className="font-semibold text-[#554d40]">Mobile Number (Nepal)</label>
            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+977 98XXXXXXXX"
              className="w-full px-3 py-2 bg-[#fdfcf9] border border-[#d9d0be] rounded-lg text-sm text-[#18221e] focus:outline-hidden focus:border-[#b8763a]"
            />
          </div>

          <div className="space-y-1">
            <label className="font-semibold text-[#554d40]">System Role *</label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as Role)}
              className="w-full px-3 py-2 bg-[#fdfcf9] border border-[#d9d0be] rounded-lg text-sm text-[#18221e] focus:outline-hidden focus:border-[#b8763a]"
            >
              <option value="staff">Clinic Staff (Appointments, Patients, Invoices)</option>
              <option value="admin">Administrator (Full Access: Therapists, Services, Users)</option>
            </select>
          </div>

          <div className="space-y-1 sm:col-span-2">
            <label className="font-semibold text-[#554d40]">
              {initial ? "Change Password (leave blank to keep current)" : "Initial Password"}
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={initial ? "••••••••" : "Default: welcome123"}
              className="w-full px-3 py-2 bg-[#fdfcf9] border border-[#d9d0be] rounded-lg text-sm text-[#18221e] focus:outline-hidden focus:border-[#b8763a]"
            />
          </div>
        </div>

        <div className="flex items-center gap-2 pt-1">
          <input
            type="checkbox"
            id="user-active"
            checked={isActive}
            onChange={(e) => setIsActive(e.target.checked)}
            className="w-4 h-4 rounded text-[#b8763a] focus:ring-0"
          />
          <label htmlFor="user-active" className="text-xs font-semibold text-[#18221e] cursor-pointer">
            User Account Active (Permitted to log in to Practice Workspace)
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
            {busy ? "Saving..." : initial ? "Update User" : "Create Account"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
