"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/components/auth-context";
import {
  FileQuestion,
  PlusCircle,
  Search,
  Sparkles,
  CheckCircle2,
  Clock,
  ArrowRight,
  MapPin,
  Calendar,
} from "lucide-react";
import { STATUS_LABELS } from "@/lib/constants";

export default function DashboardPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    myLost: 0,
    myFound: 0,
    matches: 0,
    pendingClaims: 0,
    recovered: 0,
  });
  const [recentItems, setRecentItems] = useState<any[]>([]);
  const [topMatches, setTopMatches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadDashboardData();
    }
  }, [user]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const [lostRes, foundRes, claimsRes, matchRes] = await Promise.all([
        fetch(`/api/items/lost?userId=${user?.id}`),
        fetch(`/api/items/found?userId=${user?.id}`),
        fetch("/api/claims"),
        fetch("/api/matches"),
      ]);

      const lostData = await lostRes.json();
      const foundData = await foundRes.json();
      const claimsData = await claimsRes.json();
      const matchData = await matchRes.json();

      const userLost = lostData.items || [];
      const userFound = foundData.items || [];
      const userClaims = claimsData.claims || [];
      const matches = matchData.matches || [];

      const recoveredCount =
        userLost.filter((i: any) => i.status === "RECOVERED").length +
        userClaims.filter((c: any) => c.status === "APPROVED" && c.foundItem?.status === "RECOVERED").length;

      const pendingClaimsCount = userClaims.filter(
        (c: any) => c.status === "SUBMITTED" || c.status === "UNDER_REVIEW"
      ).length;

      setStats({
        myLost: userLost.length,
        myFound: userFound.length,
        matches: matches.length,
        pendingClaims: pendingClaimsCount,
        recovered: recoveredCount,
      });

      const combined = [
        ...userLost.map((i: any) => ({ ...i, type: "LOST" })),
        ...userFound.map((i: any) => ({ ...i, type: "FOUND" })),
      ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

      setRecentItems(combined.slice(0, 5));
      setTopMatches(matches.slice(0, 2));
    } catch (e) {
      console.error("Dashboard data load error", e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      {/* Friendly Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Hi, {user?.name?.split(" ")[0] || "there"} 👋
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage your reports and track ownership verifications.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/report/lost"
            className="px-3.5 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl transition-colors"
          >
            + Report Lost
          </Link>
          <Link
            href="/report/found"
            className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition-colors"
          >
            + Report Found
          </Link>
          <Link
            href="/items"
            className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-colors"
          >
            Browse All
          </Link>
        </div>
      </div>

      {/* 3 Clean Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Link
          href="/my-reports?tab=lost"
          className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs hover:border-slate-300 transition-colors"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">My Lost Reports</span>
            <span className="w-8 h-8 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
              <FileQuestion className="w-4 h-4" />
            </span>
          </div>
          <p className="text-2xl font-bold text-slate-900 mt-2">{stats.myLost}</p>
          <span className="text-[11px] text-slate-400 mt-0.5 block">View lost reports →</span>
        </Link>

        <Link
          href="/my-reports?tab=found"
          className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs hover:border-slate-300 transition-colors"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">My Found Items</span>
            <span className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <PlusCircle className="w-4 h-4" />
            </span>
          </div>
          <p className="text-2xl font-bold text-slate-900 mt-2">{stats.myFound}</p>
          <span className="text-[11px] text-slate-400 mt-0.5 block">View found items →</span>
        </Link>

        <Link
          href="/my-reports?tab=claims"
          className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs hover:border-slate-300 transition-colors"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Claims & Recoveries</span>
            <span className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </span>
          </div>
          <p className="text-2xl font-bold text-slate-900 mt-2">
            {stats.recovered} <span className="text-xs font-normal text-slate-400">recovered</span>
          </p>
          <span className="text-[11px] text-slate-400 mt-0.5 block">
            {stats.pendingClaims} pending review →
          </span>
        </Link>
      </div>

      {/* Heuristic Matches (if any) */}
      {topMatches.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-amber-900 font-bold text-xs">
              <Sparkles className="w-4 h-4 text-amber-600" />
              <span>Potential Matches Found ({topMatches.length})</span>
            </div>
            <Link
              href="/my-reports?tab=matches"
              className="text-xs font-bold text-amber-800 hover:underline"
            >
              View All Matches →
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {topMatches.map((m, idx) => (
              <div
                key={idx}
                className="bg-white p-4 rounded-xl border border-amber-200 shadow-xs flex items-center justify-between gap-3"
              >
                <div>
                  <span className="text-[10px] font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full">
                    {m.matchScore}% Match
                  </span>
                  <h4 className="font-bold text-xs text-slate-900 mt-1 line-clamp-1">
                    {m.foundItem.itemName}
                  </h4>
                  <p className="text-[11px] text-slate-500">{m.foundItem.location}</p>
                </div>
                <Link
                  href={`/items/${m.foundItem.id}`}
                  className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg transition-colors whitespace-nowrap"
                >
                  Inspect
                </Link>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Items Activity */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-sm text-slate-900">Your Recent Activity</h3>
          <Link
            href="/my-reports"
            className="text-xs font-bold text-indigo-600 hover:underline"
          >
            All Reports →
          </Link>
        </div>

        {recentItems.length === 0 ? (
          <div className="py-8 text-center text-xs text-slate-400">
            You haven't reported any items yet.
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {recentItems.map((item) => {
              const statusInfo = STATUS_LABELS[item.status] || STATUS_LABELS.SEARCHING;
              return (
                <div
                  key={item.id}
                  className="py-3 flex items-center justify-between gap-3 text-xs"
                >
                  <div className="flex items-center gap-3">
                    <span
                      className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-[10px] ${
                        item.type === "LOST"
                          ? "bg-rose-100 text-rose-700"
                          : "bg-emerald-100 text-emerald-700"
                      }`}
                    >
                      {item.type === "LOST" ? "LST" : "FND"}
                    </span>
                    <div>
                      <h4 className="font-semibold text-slate-900">{item.itemName}</h4>
                      <span className="text-slate-400 text-[11px]">
                        {item.location} • {item.lostDate || item.foundDate}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700">
                      {statusInfo.label}
                    </span>
                    <Link
                      href={`/items/${item.id}`}
                      className="text-indigo-600 hover:underline font-bold text-[11px]"
                    >
                      View
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
