"use client";
import { FormEvent, useState } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { login, User } from "@/lib/api";

export function LoginView({ onLogin }: { onLogin: (user: User) => void }) {
  const [username, setUsername] = useState("admin");
  const [password, setPassword] = useState("admin123");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      const u = await login(username, password);
      onLogin(u);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to sign in");
    } finally {
      setBusy(false);
    }
  }

  const quickLogin = async (u: string, p: string) => {
    setUsername(u);
    setPassword(p);
    setBusy(true);
    setError("");
    try {
      const logged = await login(u, p);
      onLogin(logged);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to sign in");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-center items-center p-4 bg-[#fbf9f4]">
      <div className="mb-6 flex items-center justify-between w-full max-w-md">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#5c3a17] hover:text-[#18221e]"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to Patient Portal
        </Link>
      </div>

      <div className="w-full max-w-md bg-white border border-[#ded5c2] rounded-2xl shadow-xl p-8 space-y-6">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-xl bg-[#132420] text-[#f0dfc7] font-serif text-2xl font-bold flex items-center justify-center mx-auto">
            P
          </div>
          <h1 className="text-2xl font-serif font-semibold text-[#18221e]">
            Staff & Doctor Workspace
          </h1>
          <p className="text-xs text-[#716a5d]">
            Sign in to manage patient charts, doctor schedules, and clinical invoices.
          </p>
        </div>

        <form onSubmit={submit} className="space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-[#554d40]">Username or Email</label>
            <input
              type="text"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-[#fdfcf9] border border-[#d9d0be] rounded-xl text-sm text-[#18221e] focus:outline-hidden focus:border-[#b8763a]"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-[#554d40]">Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-[#fdfcf9] border border-[#d9d0be] rounded-xl text-sm text-[#18221e] focus:outline-hidden focus:border-[#b8763a]"
            />
          </div>

          {error && (
            <div className="p-3 bg-[#fbeaea] border border-[#f1c5c1] text-[#b5493b] text-xs rounded-xl">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={busy}
            className="w-full py-3 bg-[#b8763a] hover:bg-[#a3652e] text-white font-semibold text-sm rounded-xl transition-all shadow-sm"
          >
            {busy ? "Signing in..." : "Sign into Workspace"}
          </button>
        </form>

        {/* 1-Click Demo Logins */}
        <div className="pt-4 border-t border-[#f0e8da] space-y-2">
          <span className="text-[11px] font-semibold text-[#857d6f] uppercase tracking-wider block text-center">
            One-Click Clinical Demo Sign-In
          </span>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => quickLogin("admin", "admin123")}
              className="p-2.5 bg-[#faf5ec] hover:bg-[#f4ede1] border border-[#edd9be] rounded-xl text-left transition-colors"
            >
              <div className="text-xs font-bold text-[#18221e]">Dr. Aisha Patel</div>
              <div className="text-[10px] text-[#b8763a] font-medium">Administrator</div>
            </button>

            <button
              type="button"
              onClick={() => quickLogin("staff", "staff123")}
              className="p-2.5 bg-[#faf5ec] hover:bg-[#f4ede1] border border-[#edd9be] rounded-xl text-left transition-colors"
            >
              <div className="text-xs font-bold text-[#18221e]">Sam Rivera</div>
              <div className="text-[10px] text-[#4f7c63] font-medium">Reception Staff</div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
