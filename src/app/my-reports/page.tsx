"use client";

import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useAuth } from "@/components/auth-context";
import {
  FileQuestion,
  PlusCircle,
  Sparkles,
  Clock,
  CheckCircle2,
  AlertCircle,
  Tag,
  MapPin,
  Calendar,
  ArrowRight,
  ExternalLink,
  MessageSquare,
  ShieldAlert,
} from "lucide-react";
import { STATUS_LABELS } from "@/lib/constants";

function MyReportsContent() {
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const initialTab = searchParams.get("tab") || "lost";

  const [activeTab, setActiveTab] = useState<"lost" | "found" | "claims" | "matches">(
    initialTab as any
  );
  const [lostItems, setLostItems] = useState<any[]>([]);
  const [foundItems, setFoundItems] = useState<any[]>([]);
  const [claims, setClaims] = useState<any[]>([]);
  const [matches, setMatches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchAllData();
    }
  }, [user]);

  const fetchAllData = async () => {
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

      setLostItems(lostData.items || []);
      setFoundItems(foundData.items || []);
      setClaims(claimsData.claims || []);
      setMatches(matchData.matches || []);
    } catch (e) {
      console.error("Failed to load user reports", e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100 pb-6">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">
            My Reports & Recovery Tracking
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">
            Track status updates, respond to admin info requests, and inspect automated matches.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/report/lost"
            className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs rounded-xl shadow-sm transition-colors"
          >
            + Report Lost
          </Link>
          <Link
            href="/report/found"
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs rounded-xl shadow-sm transition-colors"
          >
            + Report Found
          </Link>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center space-x-2 border-b border-gray-200/80 pb-1 overflow-x-auto">
        <button
          onClick={() => setActiveTab("lost")}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            activeTab === "lost"
              ? "bg-brand-600 text-white shadow-sm"
              : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
          }`}
        >
          <FileQuestion className="w-4 h-4" />
          My Lost Items ({lostItems.length})
        </button>

        <button
          onClick={() => setActiveTab("found")}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            activeTab === "found"
              ? "bg-brand-600 text-white shadow-sm"
              : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
          }`}
        >
          <PlusCircle className="w-4 h-4" />
          My Found Items ({foundItems.length})
        </button>

        <button
          onClick={() => setActiveTab("claims")}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            activeTab === "claims"
              ? "bg-brand-600 text-white shadow-sm"
              : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
          }`}
        >
          <Clock className="w-4 h-4" />
          My Claims ({claims.length})
        </button>

        <button
          onClick={() => setActiveTab("matches")}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            activeTab === "matches"
              ? "bg-amber-500 text-white shadow-sm"
              : "text-amber-800 bg-amber-50 hover:bg-amber-100"
          }`}
        >
          <Sparkles className="w-4 h-4" />
          Possible Matches ({matches.length})
        </button>
      </div>

      {/* Tab 1: My Lost Items */}
      {activeTab === "lost" && (
        <div className="space-y-4">
          {lostItems.length === 0 ? (
            <div className="bg-white rounded-3xl border border-gray-100 p-12 text-center space-y-3">
              <FileQuestion className="w-8 h-8 text-gray-400 mx-auto" />
              <h3 className="font-bold text-gray-800 text-sm">You haven't reported any lost items yet.</h3>
              <Link
                href="/report/lost"
                className="inline-block px-4 py-2 bg-brand-600 text-white text-xs font-semibold rounded-xl mt-2"
              >
                Report Lost Item
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {lostItems.map((item) => {
                const statusInfo = STATUS_LABELS[item.status] || STATUS_LABELS.SEARCHING;
                return (
                  <div
                    key={item.id}
                    className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm flex flex-col justify-between space-y-4"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-mono text-xs text-gray-400 font-semibold">
                          {item.reportId}
                        </span>
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-bold border ${statusInfo.bg} ${statusInfo.text} ${statusInfo.border}`}
                        >
                          {statusInfo.label}
                        </span>
                      </div>
                      <h3 className="font-bold text-base text-gray-900">{item.itemName}</h3>
                      <p className="text-xs text-gray-500 mt-1 line-clamp-2">{item.description}</p>
                    </div>

                    <div className="pt-3 border-t border-gray-50 flex items-center justify-between text-xs text-gray-500">
                      <div className="flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-gray-400" />
                        <span>{item.location}</span>
                      </div>
                      <Link
                        href={`/items/${item.id}`}
                        className="font-bold text-brand-600 hover:text-brand-800"
                      >
                        View Report →
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Tab 2: My Found Items */}
      {activeTab === "found" && (
        <div className="space-y-4">
          {foundItems.length === 0 ? (
            <div className="bg-white rounded-3xl border border-gray-100 p-12 text-center space-y-3">
              <PlusCircle className="w-8 h-8 text-gray-400 mx-auto" />
              <h3 className="font-bold text-gray-800 text-sm">You haven't reported any found items yet.</h3>
              <Link
                href="/report/found"
                className="inline-block px-4 py-2 bg-emerald-600 text-white text-xs font-semibold rounded-xl mt-2"
              >
                Report Found Item
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {foundItems.map((item) => {
                const statusInfo = STATUS_LABELS[item.status] || STATUS_LABELS.REPORTED;
                return (
                  <div
                    key={item.id}
                    className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm flex flex-col justify-between space-y-4"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-mono text-xs text-gray-400 font-semibold">
                          {item.reportId}
                        </span>
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-bold border ${statusInfo.bg} ${statusInfo.text} ${statusInfo.border}`}
                        >
                          {statusInfo.label}
                        </span>
                      </div>
                      <h3 className="font-bold text-base text-gray-900">{item.itemName}</h3>
                      <p className="text-xs text-gray-500 mt-1 line-clamp-2">{item.description}</p>
                    </div>

                    <div className="pt-3 border-t border-gray-50 flex items-center justify-between text-xs text-gray-500">
                      <div className="flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-gray-400" />
                        <span>{item.location}</span>
                      </div>
                      <Link
                        href={`/items/${item.id}`}
                        className="font-bold text-emerald-600 hover:text-emerald-800"
                      >
                        View Item →
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Tab 3: My Claims */}
      {activeTab === "claims" && (
        <div className="space-y-4">
          {claims.length === 0 ? (
            <div className="bg-white rounded-3xl border border-gray-100 p-12 text-center space-y-3">
              <Clock className="w-8 h-8 text-gray-400 mx-auto" />
              <h3 className="font-bold text-gray-800 text-sm">No claims submitted yet.</h3>
              <p className="text-xs text-gray-400 max-w-sm mx-auto">
                Found an item in the directory that belongs to you? Submit a claim with verification proof.
              </p>
              <Link
                href="/items"
                className="inline-block px-4 py-2 bg-brand-600 text-white text-xs font-semibold rounded-xl mt-2"
              >
                Browse Items to Claim
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {claims.map((claim) => {
                const statusInfo = STATUS_LABELS[claim.status] || STATUS_LABELS.SUBMITTED;
                return (
                  <div
                    key={claim.id}
                    className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm space-y-4"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-gray-100 pb-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-bold text-base text-gray-900">
                            {claim.foundItem?.itemName || "Claimed Item"}
                          </h3>
                          <span className="text-xs font-mono text-gray-400">
                            {claim.foundItem?.reportId}
                          </span>
                        </div>
                        <span className="text-xs text-gray-500">
                          Submitted on {new Date(claim.createdAt).toLocaleDateString()}
                        </span>
                      </div>

                      <span
                        className={`px-3 py-1 rounded-full text-xs font-bold border self-start sm:self-auto ${statusInfo.bg} ${statusInfo.text} ${statusInfo.border}`}
                      >
                        {statusInfo.label}
                      </span>
                    </div>

                    {/* Admin Notes / Inquiries */}
                    {claim.adminNotes && (
                      <div className="p-4 bg-indigo-50/70 border border-indigo-100 rounded-2xl space-y-1 text-xs">
                        <div className="flex items-center gap-1.5 font-bold text-indigo-900">
                          <MessageSquare className="w-4 h-4 text-indigo-600" />
                          <span>Administrator Feedback:</span>
                        </div>
                        <p className="text-indigo-800 leading-relaxed pl-5.5">
                          {claim.adminNotes}
                        </p>
                      </div>
                    )}

                    {/* Submitted details summary */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs bg-gray-50/60 p-4 rounded-2xl">
                      <div>
                        <span className="text-gray-400 block">Reported Loss Location:</span>
                        <span className="font-semibold text-gray-800">{claim.lostLocation}</span>
                      </div>
                      <div>
                        <span className="text-gray-400 block">Reported Loss Time:</span>
                        <span className="font-semibold text-gray-800">{claim.lostTime}</span>
                      </div>
                      {claim.exactModel && (
                        <div>
                          <span className="text-gray-400 block">Exact Model Provided:</span>
                          <span className="font-semibold text-gray-800">{claim.exactModel}</span>
                        </div>
                      )}
                      {claim.serialNumber && (
                        <div>
                          <span className="text-gray-400 block">Serial Number / Unique ID:</span>
                          <span className="font-semibold text-gray-800">{claim.serialNumber}</span>
                        </div>
                      )}
                      {claim.uniqueMarks && (
                        <div className="sm:col-span-2">
                          <span className="text-gray-400 block">Unique Marks & Wear:</span>
                          <span className="font-semibold text-gray-800">{claim.uniqueMarks}</span>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center justify-end">
                      <Link
                        href={`/items/${claim.foundItemId}`}
                        className="text-xs font-semibold text-brand-600 hover:text-brand-800 flex items-center gap-1"
                      >
                        View Item Listing <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Tab 4: Possible Matches (Heuristic Engine) */}
      {activeTab === "matches" && (
        <div className="space-y-4">
          <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl text-xs text-amber-900 flex items-start gap-2.5">
            <Sparkles className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">Prototype Rule-Based Matching System (Not Artificial Intelligence)</p>
              <p className="text-amber-700 mt-0.5">
                Our algorithm calculates similarity scores by cross-referencing category, brand, keywords, color, location, and date proximity.
              </p>
            </div>
          </div>

          {matches.length === 0 ? (
            <div className="bg-white rounded-3xl border border-gray-100 p-12 text-center space-y-3">
              <Sparkles className="w-8 h-8 text-amber-400 mx-auto" />
              <h3 className="font-bold text-gray-800 text-sm">No matches detected at this moment.</h3>
              <p className="text-xs text-gray-400 max-w-sm mx-auto">
                Whenever a found item is reported that aligns with your lost belongings, it will appear here automatically.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {matches.map((m, idx) => (
                <div
                  key={idx}
                  className="bg-white p-6 rounded-3xl border border-amber-200 shadow-sm hover:shadow-md transition-all flex flex-col justify-between space-y-5"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="px-3 py-1 rounded-full text-xs font-black bg-amber-100 text-amber-900">
                        🎯 Possible Match: {m.matchScore}%
                      </span>
                      <span className="text-xs text-gray-400 font-mono">
                        {m.foundItem.reportId}
                      </span>
                    </div>

                    {/* Comparison Box */}
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="p-3 bg-rose-50/70 border border-rose-100 rounded-2xl">
                        <span className="text-[10px] font-bold text-rose-700 uppercase block">
                          Your Lost Item
                        </span>
                        <p className="font-bold text-gray-900 mt-1">{m.lostItem.itemName}</p>
                        <p className="text-gray-500 mt-0.5">{m.lostItem.location}</p>
                      </div>

                      <div className="p-3 bg-emerald-50/70 border border-emerald-100 rounded-2xl">
                        <span className="text-[10px] font-bold text-emerald-700 uppercase block">
                          Reported Found Item
                        </span>
                        <p className="font-bold text-gray-900 mt-1">{m.foundItem.itemName}</p>
                        <p className="text-gray-500 mt-0.5">{m.foundItem.location}</p>
                      </div>
                    </div>

                    {/* Matched Factors Breakdown */}
                    <div className="space-y-1">
                      <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                        Matched Heuristic Criteria:
                      </span>
                      <ul className="space-y-1 text-xs text-gray-600">
                        {m.matchedPointsSummary.map((pt: string, pidx: number) => (
                          <li key={pidx} className="flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                            <span>{pt}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-gray-100 flex items-center justify-between">
                    <span className="text-xs text-gray-400">
                      Found on: {m.foundItem.foundDate}
                    </span>
                    <Link
                      href={`/items/${m.foundItem.id}`}
                      className="px-4 py-2 bg-gradient-to-r from-brand-600 to-accent-600 hover:from-brand-700 hover:to-accent-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-1"
                    >
                      <span>Inspect & Claim</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function MyReportsPage() {
  return (
    <Suspense fallback={<div className="p-10 text-center text-xs text-gray-400">Loading your reports...</div>}>
      <MyReportsContent />
    </Suspense>
  );
}
