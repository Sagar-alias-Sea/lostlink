"use client";

import React, { useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/components/auth-context";
import { Link2, AlertCircle, ArrowRight, Loader2, ShieldCheck, UserCheck } from "lucide-react";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect") || "/dashboard";

  const { refreshUser } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Invalid credentials.");
        setLoading(false);
        return;
      }

      await refreshUser();
      if (data.user?.role === "ADMIN") {
        router.push("/admin");
      } else {
        router.push(redirect);
      }
    } catch {
      setError("Network error. Please try again.");
      setLoading(false);
    }
  };

  const fillDemo = (demoEmail: string, demoPass: string) => {
    setEmail(demoEmail);
    setPassword(demoPass);
    setError(null);
  };

  return (
    <div className="max-w-md w-full space-y-8 bg-white p-8 sm:p-10 rounded-3xl border border-gray-100 shadow-xl shadow-gray-200/50">
      <div className="text-center space-y-2">
        <div className="w-12 h-12 mx-auto rounded-2xl bg-gradient-to-tr from-brand-600 to-accent-600 flex items-center justify-center text-white shadow-md shadow-indigo-200">
          <Link2 className="w-6 h-6 -rotate-45" />
        </div>
        <h2 className="text-2xl font-extrabold text-gray-900 tracking-tight">
          Welcome to LostLink
        </h2>
        <p className="text-xs text-gray-500">
          Sign in to report items, track claims, and manage recoveries.
        </p>
      </div>

      {error && (
        <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-1">
            Email Address
          </label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="name@campus.edu"
            className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-colors"
          />
        </div>

        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="block text-xs font-semibold text-gray-700">
              Password
            </label>
            <span className="text-[11px] text-gray-400">Default: Admin@12345 / User@12345</span>
          </div>
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-colors"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 px-4 rounded-xl text-white font-semibold bg-gradient-to-r from-brand-600 to-accent-600 hover:from-brand-700 hover:to-accent-700 shadow-md shadow-indigo-200 transition-all hover:shadow-lg disabled:opacity-50 flex items-center justify-center gap-2 mt-4"
        >
          {loading ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <>
              <span>Sign In</span>
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </form>

      {/* 1-Click Demo Accounts */}
      <div className="pt-4 border-t border-gray-100">
        <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider text-center mb-3">
          Quick 1-Click Demo Logins
        </p>
        <div className="grid grid-cols-3 gap-2">
          <button
            type="button"
            onClick={() => fillDemo("admin@lostlink.org", "Admin@12345")}
            className="p-2 text-left bg-purple-50 hover:bg-purple-100 border border-purple-200 rounded-xl transition-colors"
          >
            <div className="flex items-center gap-1 text-[11px] font-bold text-purple-800">
              <ShieldCheck className="w-3.5 h-3.5" />
              Admin
            </div>
            <span className="text-[10px] text-purple-600 block mt-0.5 truncate">Security Desk</span>
          </button>

          <button
            type="button"
            onClick={() => fillDemo("alex.chen@campus.edu", "User@12345")}
            className="p-2 text-left bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-xl transition-colors"
          >
            <div className="flex items-center gap-1 text-[11px] font-bold text-blue-800">
              <UserCheck className="w-3.5 h-3.5" />
              Alex (User)
            </div>
            <span className="text-[10px] text-blue-600 block mt-0.5 truncate">Claimant A</span>
          </button>

          <button
            type="button"
            onClick={() => fillDemo("david.kim@campus.edu", "User@12345")}
            className="p-2 text-left bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-xl transition-colors"
          >
            <div className="flex items-center gap-1 text-[11px] font-bold text-emerald-800">
              <UserCheck className="w-3.5 h-3.5" />
              David (User)
            </div>
            <span className="text-[10px] text-emerald-600 block mt-0.5 truncate">Claimant B</span>
          </button>
        </div>
      </div>

      <div className="pt-2 text-center">
        <p className="text-xs text-gray-500">
          Don't have an account?{" "}
          <Link href="/register" className="font-semibold text-brand-600 hover:text-brand-800">
            Create an account
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-[80vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <Suspense fallback={<div className="text-xs text-gray-400">Loading sign in...</div>}>
        <LoginForm />
      </Suspense>
    </div>
  );
}
