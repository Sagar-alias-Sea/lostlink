"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/auth-context";
import {
  ShieldCheck,
  Users,
  FileQuestion,
  PlusCircle,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Layers,
  Search,
  Filter,
  BarChart3,
  TrendingUp,
  Tag,
  MapPin,
  Calendar,
  Trash2,
  Check,
  X,
  MessageSquare,
  Sparkles,
  ExternalLink,
  Lock,
  ArrowRight,
  Loader2,
  RefreshCw,
} from "lucide-react";
import { CATEGORIES, STATUS_LABELS } from "@/lib/constants";

export default function AdminPortalPage() {
  const { user } = useAuth();
  const router = useRouter();

  // Tab state: "overview" | "reports" | "claims" | "recovery"
  const [activeTab, setActiveTab] = useState<"overview" | "reports" | "claims" | "recovery">("overview");

  // Stats state
  const [statsData, setStatsData] = useState<any>(null);
  const [loadingStats, setLoadingStats] = useState(true);

  // Reports state
  const [reports, setReports] = useState<{ lostItems: any[]; foundItems: any[] }>({
    lostItems: [],
    foundItems: [],
  });
  const [reportTypeFilter, setReportTypeFilter] = useState("ALL");
  const [reportSearch, setReportSearch] = useState("");
  const [loadingReports, setLoadingReports] = useState(false);

  // Claims state
  const [claims, setClaims] = useState<any[]>([]);
  const [claimStatusFilter, setClaimStatusFilter] = useState("ALL");
  const [loadingClaims, setLoadingClaims] = useState(false);

  // Modals & Action States
  const [selectedClaimForAction, setSelectedClaimForAction] = useState<any>(null);
  const [actionModalType, setActionModalType] = useState<"APPROVE" | "REJECT" | "REQUEST_INFO" | null>(null);
  const [adminNoteInput, setAdminNoteInput] = useState("");
  const [submittingAction, setSubmittingAction] = useState(false);

  // Handover modal state
  const [recoveryModalItem, setRecoveryModalItem] = useState<any>(null);
  const [handoverNotes, setHandoverNotes] = useState("");
  const [submittingRecovery, setSubmittingRecovery] = useState(false);

  // Delete confirmation modal state
  const [deleteConfirmTarget, setDeleteConfirmTarget] = useState<{ id: string; type: "LOST" | "FOUND"; name: string } | null>(null);

  useEffect(() => {
    if (user) {
      if (user.role !== "ADMIN") {
        router.push("/dashboard?error=admin_required");
        return;
      }
      fetchStats();
      fetchReports();
      fetchClaims();
    }
  }, [user]);

  const fetchStats = async () => {
    try {
      setLoadingStats(true);
      const res = await fetch("/api/admin/stats");
      if (res.ok) {
        const data = await res.json();
        setStatsData(data);
      }
    } catch (e) {
      console.error("Stats load error", e);
    } finally {
      setLoadingStats(false);
    }
  };

  const fetchReports = async () => {
    try {
      setLoadingReports(true);
      const params = new URLSearchParams();
      if (reportTypeFilter !== "ALL") params.set("type", reportTypeFilter);
      if (reportSearch.trim()) params.set("q", reportSearch.trim());

      const res = await fetch(`/api/admin/reports?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setReports(data);
      }
    } catch (e) {
      console.error("Reports load error", e);
    } finally {
      setLoadingReports(false);
    }
  };

  const fetchClaims = async () => {
    try {
      setLoadingClaims(true);
      const res = await fetch(`/api/admin/claims?status=${claimStatusFilter}`);
      if (res.ok) {
        const data = await res.json();
        setClaims(data.claims || []);
      }
    } catch (e) {
      console.error("Claims load error", e);
    } finally {
      setLoadingClaims(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, [reportTypeFilter]);

  useEffect(() => {
    fetchClaims();
  }, [claimStatusFilter]);

  // Handle Claim Actions (Approve, Reject, Request Info)
  const handleExecuteClaimAction = async () => {
    if (!selectedClaimForAction || !actionModalType) return;
    setSubmittingAction(true);

    try {
      const res = await fetch(`/api/admin/claims/${selectedClaimForAction.id}/action`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: actionModalType,
          adminNotes: adminNoteInput,
        }),
      });

      if (res.ok) {
        setActionModalType(null);
        setSelectedClaimForAction(null);
        setAdminNoteInput("");
        await fetchClaims();
        await fetchStats();
      } else {
        const err = await res.json();
        alert(err.error || "Action failed.");
      }
    } catch {
      alert("Network error.");
    } finally {
      setSubmittingAction(false);
    }
  };

  // Handle Item Recovery Handover
  const handleExecuteRecovery = async () => {
    if (!recoveryModalItem) return;
    setSubmittingRecovery(true);

    try {
      const res = await fetch("/api/admin/recover", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          foundItemId: recoveryModalItem.foundItemId,
          claimId: recoveryModalItem.claimId,
          handoverNotes,
        }),
      });

      if (res.ok) {
        setRecoveryModalItem(null);
        setHandoverNotes("");
        await fetchClaims();
        await fetchReports();
        await fetchStats();
      } else {
        const err = await res.json();
        alert(err.error || "Failed to mark item recovered.");
      }
    } catch {
      alert("Network error.");
    } finally {
      setSubmittingRecovery(false);
    }
  };

  // Handle Delete Report
  const handleExecuteDelete = async () => {
    if (!deleteConfirmTarget) return;
    try {
      const res = await fetch(
        `/api/admin/reports?id=${deleteConfirmTarget.id}&type=${deleteConfirmTarget.type}`,
        { method: "DELETE" }
      );
      if (res.ok) {
        setDeleteConfirmTarget(null);
        await fetchReports();
        await fetchStats();
      }
    } catch {
      alert("Failed to delete report.");
    }
  };

  // Group claims by Found Item to easily render side-by-side multiple claim comparisons
  const claimsByFoundItem: Record<string, { item: any; claims: any[] }> = {};
  claims.forEach((c) => {
    if (!claimsByFoundItem[c.foundItemId]) {
      claimsByFoundItem[c.foundItemId] = {
        item: c.foundItem,
        claims: [],
      };
    }
    claimsByFoundItem[c.foundItemId].claims.push(c);
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Admin Header */}
      <div className="bg-gradient-to-r from-purple-950 via-indigo-950 to-brand-950 rounded-3xl p-8 text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/20 border border-purple-400/30 text-purple-300 text-xs font-semibold">
            <ShieldCheck className="w-4 h-4 text-purple-400" />
            Administrative Command Center
          </div>
          <h1 className="text-3xl font-black tracking-tight">
            LostLink Administration Portal
          </h1>
          <p className="text-xs sm:text-sm text-purple-200/80 max-w-2xl">
            Review multi-claim ownership disputes, verify serial numbers, manage campus-wide lost & found records, and inspect recovery analytics.
          </p>
        </div>

        <button
          onClick={() => {
            fetchStats();
            fetchReports();
            fetchClaims();
          }}
          className="px-4 py-2.5 bg-white/10 hover:bg-white/20 border border-white/20 text-white font-semibold text-xs rounded-xl flex items-center gap-2 self-start md:self-auto transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh Portal
        </button>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center space-x-2 border-b border-gray-200 pb-1 overflow-x-auto">
        <button
          onClick={() => setActiveTab("overview")}
          className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            activeTab === "overview"
              ? "bg-purple-600 text-white shadow-sm"
              : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
          }`}
        >
          <BarChart3 className="w-4 h-4" />
          Overview & Analytics
        </button>

        <button
          onClick={() => setActiveTab("claims")}
          className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            activeTab === "claims"
              ? "bg-purple-600 text-white shadow-sm"
              : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
          }`}
        >
          <Layers className="w-4 h-4" />
          Claim Verification & Disputes ({claims.length})
        </button>

        <button
          onClick={() => setActiveTab("reports")}
          className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            activeTab === "reports"
              ? "bg-purple-600 text-white shadow-sm"
              : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
          }`}
        >
          <Search className="w-4 h-4" />
          All Reports Management
        </button>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: OVERVIEW & ANALYTICS                                              */}
      {/* ========================================================================= */}
      {activeTab === "overview" && (
        <div className="space-y-8">
          {/* Top Metric Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
              <span className="text-xs font-semibold text-gray-500">Registered Users</span>
              <p className="text-2xl font-black text-gray-900 mt-2">
                {statsData?.stats?.totalUsers ?? "—"}
              </p>
              <span className="text-[10px] text-gray-400 mt-1 block">Campus accounts</span>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
              <span className="text-xs font-semibold text-gray-500">Lost Reports</span>
              <p className="text-2xl font-black text-rose-600 mt-2">
                {statsData?.stats?.totalLostReports ?? "—"}
              </p>
              <span className="text-[10px] text-gray-400 mt-1 block">Pending recovery</span>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
              <span className="text-xs font-semibold text-gray-500">Found Items</span>
              <p className="text-2xl font-black text-emerald-600 mt-2">
                {statsData?.stats?.totalFoundReports ?? "—"}
              </p>
              <span className="text-[10px] text-gray-400 mt-1 block">In custody/reported</span>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-amber-200 bg-amber-50/20 shadow-sm">
              <span className="text-xs font-semibold text-amber-800">Multiple Claim Disputes</span>
              <p className="text-2xl font-black text-amber-700 mt-2">
                {statsData?.stats?.multipleClaimsCount ?? "—"}
              </p>
              <span className="text-[10px] text-amber-600 mt-1 block">Requires admin review</span>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
              <span className="text-xs font-semibold text-gray-500">Pending Claims</span>
              <p className="text-2xl font-black text-purple-600 mt-2">
                {statsData?.stats?.pendingClaims ?? "—"}
              </p>
              <span className="text-[10px] text-gray-400 mt-1 block">Awaiting review</span>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-emerald-100 bg-emerald-50/20 shadow-sm">
              <span className="text-xs font-semibold text-emerald-800">Recovery Rate</span>
              <p className="text-2xl font-black text-emerald-700 mt-2">
                {statsData?.stats?.recoveryRate ?? 0}%
              </p>
              <span className="text-[10px] text-emerald-600 mt-1 block">
                {statsData?.stats?.totalRecovered ?? 0} items recovered
              </span>
            </div>
          </div>

          {/* Graphical Breakdowns & Visual Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Chart 1: Categories Breakdown */}
            <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-base text-gray-900 flex items-center gap-2">
                  <Tag className="w-4 h-4 text-brand-600" />
                  Most Lost & Found Categories
                </h3>
                <span className="text-xs text-gray-400">Total Volume</span>
              </div>

              <div className="space-y-3 pt-2">
                {(statsData?.categoryBreakdown || []).map((cat: any, i: number) => {
                  const maxCount = Math.max(
                    ...(statsData?.categoryBreakdown || []).map((c: any) => c.total),
                    1
                  );
                  const percentage = Math.round((cat.total / maxCount) * 100);

                  return (
                    <div key={i} className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-gray-800">{cat.category}</span>
                        <span className="text-gray-500 font-mono">
                          {cat.lost} lost • {cat.found} found ({cat.total} total)
                        </span>
                      </div>
                      <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden flex">
                        <div
                          className="bg-rose-500 h-full transition-all"
                          style={{ width: `${(cat.lost / cat.total) * percentage}%` }}
                          title={`${cat.lost} Lost`}
                        />
                        <div
                          className="bg-emerald-500 h-full transition-all"
                          style={{ width: `${(cat.found / cat.total) * percentage}%` }}
                          title={`${cat.found} Found`}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="flex items-center gap-4 text-xs text-gray-500 pt-2 border-t border-gray-100">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                  <span>Lost Reports</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                  <span>Found Items</span>
                </div>
              </div>
            </div>

            {/* Chart 2: Top Locations */}
            <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-base text-gray-900 flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-indigo-600" />
                  Reports by Campus Location
                </h3>
                <span className="text-xs text-gray-400">High-Loss Zones</span>
              </div>

              <div className="space-y-3 pt-2">
                {(statsData?.topLocations || []).map((loc: any, idx: number) => (
                  <div
                    key={idx}
                    className="p-3.5 bg-gray-50 rounded-2xl flex items-center justify-between border border-gray-100"
                  >
                    <div className="flex items-center gap-3">
                      <span className="w-6 h-6 rounded-lg bg-white text-gray-700 font-bold text-xs flex items-center justify-center shadow-xs">
                        {idx + 1}
                      </span>
                      <span className="text-xs font-semibold text-gray-800">
                        {loc.location}
                      </span>
                    </div>
                    <span className="text-xs font-bold px-2.5 py-1 bg-indigo-50 text-indigo-700 rounded-lg">
                      {loc.count} items
                    </span>
                  </div>
                ))}
              </div>

              {/* Recovery Workflow Summary Callout */}
              <div className="p-4 bg-purple-50/70 border border-purple-100 rounded-2xl space-y-1 text-xs text-purple-900">
                <span className="font-bold flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-purple-600" />
                  Verification Standard Operating Procedure (SOP):
                </span>
                <p className="text-purple-800 leading-relaxed">
                  Always check serial number tags, exact mark placements, and receipts. Never release an item until competing claims have been thoroughly cross-compared.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: CLAIMS MANAGEMENT & MULTIPLE-CLAIM COMPARISON MATRIX               */}
      {/* ========================================================================= */}
      {activeTab === "claims" && (
        <div className="space-y-6">
          {/* Filter Bar */}
          <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-gray-500">Filter By:</span>
              <button
                onClick={() => setClaimStatusFilter("ALL")}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  claimStatusFilter === "ALL" ? "bg-purple-600 text-white" : "bg-gray-100 text-gray-600"
                }`}
              >
                All Claims
              </button>
              <button
                onClick={() => setClaimStatusFilter("MULTIPLE")}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                  claimStatusFilter === "MULTIPLE"
                    ? "bg-rose-600 text-white shadow-sm"
                    : "bg-rose-50 text-rose-700 border border-rose-200"
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                Multiple Claims Only
              </button>
              <button
                onClick={() => setClaimStatusFilter("PENDING")}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  claimStatusFilter === "PENDING" ? "bg-purple-600 text-white" : "bg-gray-100 text-gray-600"
                }`}
              >
                Pending Review
              </button>
              <button
                onClick={() => setClaimStatusFilter("APPROVED")}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  claimStatusFilter === "APPROVED" ? "bg-purple-600 text-white" : "bg-gray-100 text-gray-600"
                }`}
              >
                Approved
              </button>
            </div>

            <span className="text-xs text-gray-400 font-medium">
              {Object.keys(claimsByFoundItem).length} items with claim activity
            </span>
          </div>

          {/* Grouped Claims Presentation */}
          {Object.keys(claimsByFoundItem).length === 0 ? (
            <div className="bg-white rounded-3xl border border-gray-100 p-12 text-center space-y-3">
              <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto" />
              <h3 className="font-bold text-gray-800 text-sm">No claims match the selected filter.</h3>
              <p className="text-xs text-gray-400">All submitted claims have been processed or none have been filed yet.</p>
            </div>
          ) : (
            <div className="space-y-8">
              {Object.entries(claimsByFoundItem).map(([foundItemId, { item, claims: itemClaims }]) => {
                const isMultiClaim = itemClaims.length > 1;
                const approvedClaim = itemClaims.find((c) => c.status === "APPROVED");

                return (
                  <div
                    key={foundItemId}
                    className={`bg-white rounded-3xl border shadow-sm overflow-hidden ${
                      isMultiClaim ? "border-rose-200 ring-2 ring-rose-100" : "border-gray-200"
                    }`}
                  >
                    {/* Header Banner for Found Item */}
                    <div
                      className={`p-6 border-b flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                        isMultiClaim ? "bg-rose-50/60 border-rose-200" : "bg-gray-50 border-gray-200"
                      }`}
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-bold text-gray-500">
                            {item.reportId}
                          </span>
                          {isMultiClaim && (
                            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-black bg-rose-600 text-white uppercase tracking-wider flex items-center gap-1">
                              <Layers className="w-3 h-3" />
                              MULTIPLE CLAIMS — ADMIN REVIEW REQUIRED ({itemClaims.length})
                            </span>
                          )}
                        </div>
                        <h3 className="font-black text-lg text-gray-900">{item.itemName}</h3>
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-600">
                          <span><strong>Category:</strong> {item.category}</span>
                          <span><strong>Found Location:</strong> {item.location}</span>
                          <span><strong>Found Date:</strong> {item.foundDate}</span>
                        </div>
                      </div>

                      {/* Ready for Handover Button */}
                      {approvedClaim && item.status !== "RECOVERED" && (
                        <button
                          onClick={() =>
                            setRecoveryModalItem({
                              foundItemId: item.id,
                              claimId: approvedClaim.id,
                              itemName: item.itemName,
                              claimantName: approvedClaim.claimant.name,
                            })
                          }
                          className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md transition-colors flex items-center gap-2"
                        >
                          <ShieldCheck className="w-4 h-4" />
                          Mark Ready / Complete Handover
                        </button>
                      )}

                      {item.status === "RECOVERED" && (
                        <div className="px-4 py-2 bg-emerald-100 text-emerald-800 rounded-xl text-xs font-bold flex items-center gap-1.5">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                          Item Handover Completed (Recovered)
                        </div>
                      )}
                    </div>

                    {/* Side-by-Side Comparison Table for Multiple Claims */}
                    {isMultiClaim ? (
                      <div className="p-6 space-y-4">
                        <div className="text-xs font-bold uppercase tracking-wider text-rose-700 flex items-center gap-2">
                          <span>Verification Factor Comparison Matrix</span>
                        </div>

                        <div className="overflow-x-auto">
                          <table className="w-full text-xs text-left border-collapse border border-gray-200">
                            <thead>
                              <tr className="bg-gray-100 text-gray-700 border-b border-gray-200">
                                <th className="p-3 font-bold border-r border-gray-200 w-44">Verification Factor</th>
                                {itemClaims.map((claim, idx) => (
                                  <th key={claim.id} className="p-3 font-bold border-r border-gray-200">
                                    Claim {String.fromCharCode(65 + idx)}: {claim.claimant.name}
                                    <span className="block text-[10px] font-normal text-gray-500">
                                      {claim.claimant.organization || claim.claimant.email}
                                    </span>
                                  </th>
                                ))}
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                              <tr>
                                <td className="p-3 font-semibold bg-gray-50 border-r border-gray-200">Claim Status</td>
                                {itemClaims.map((claim) => (
                                  <td key={claim.id} className="p-3 border-r border-gray-200">
                                    <span
                                      className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${
                                        STATUS_LABELS[claim.status]?.bg
                                      } ${STATUS_LABELS[claim.status]?.text} ${
                                        STATUS_LABELS[claim.status]?.border
                                      }`}
                                    >
                                      {STATUS_LABELS[claim.status]?.label || claim.status}
                                    </span>
                                  </td>
                                ))}
                              </tr>

                              <tr>
                                <td className="p-3 font-semibold bg-gray-50 border-r border-gray-200">Loss Location</td>
                                {itemClaims.map((claim) => (
                                  <td key={claim.id} className="p-3 border-r border-gray-200 font-medium text-gray-800">
                                    {claim.lostLocation}
                                  </td>
                                ))}
                              </tr>

                              <tr>
                                <td className="p-3 font-semibold bg-gray-50 border-r border-gray-200">Loss Time</td>
                                {itemClaims.map((claim) => (
                                  <td key={claim.id} className="p-3 border-r border-gray-200 font-medium text-gray-800">
                                    {claim.lostTime}
                                  </td>
                                ))}
                              </tr>

                              <tr>
                                <td className="p-3 font-semibold bg-gray-50 border-r border-gray-200">Exact Model Stated</td>
                                {itemClaims.map((claim) => (
                                  <td key={claim.id} className="p-3 border-r border-gray-200 font-medium text-gray-800">
                                    {claim.exactModel || <span className="text-gray-400">None stated</span>}
                                  </td>
                                ))}
                              </tr>

                              <tr>
                                <td className="p-3 font-semibold bg-gray-50 border-r border-gray-200">Serial Number / Unique ID</td>
                                {itemClaims.map((claim) => (
                                  <td key={claim.id} className="p-3 border-r border-gray-200 font-medium text-gray-800">
                                    {claim.serialNumber ? (
                                      <span className="font-mono bg-purple-50 text-purple-900 px-2 py-0.5 rounded">
                                        {claim.serialNumber}
                                      </span>
                                    ) : (
                                      <span className="text-gray-400">None provided</span>
                                    )}
                                  </td>
                                ))}
                              </tr>

                              <tr>
                                <td className="p-3 font-semibold bg-gray-50 border-r border-gray-200">Unique Marks & Damage</td>
                                {itemClaims.map((claim) => (
                                  <td key={claim.id} className="p-3 border-r border-gray-200 text-gray-800">
                                    {claim.uniqueMarks || <span className="text-gray-400">None</span>}
                                  </td>
                                ))}
                              </tr>

                              <tr>
                                <td className="p-3 font-semibold bg-gray-50 border-r border-gray-200">Accessories / Extras</td>
                                {itemClaims.map((claim) => (
                                  <td key={claim.id} className="p-3 border-r border-gray-200 text-gray-800">
                                    {claim.accessories || <span className="text-gray-400">None</span>}
                                  </td>
                                ))}
                              </tr>

                              <tr>
                                <td className="p-3 font-semibold bg-gray-50 border-r border-gray-200">Confidential Details</td>
                                {itemClaims.map((claim) => (
                                  <td key={claim.id} className="p-3 border-r border-gray-200 text-gray-700 leading-relaxed">
                                    {claim.identifyingInfo || <span className="text-gray-400">None</span>}
                                  </td>
                                ))}
                              </tr>

                              <tr>
                                <td className="p-3 font-semibold bg-gray-50 border-r border-gray-200">Proof / Receipt Attached</td>
                                {itemClaims.map((claim) => (
                                  <td key={claim.id} className="p-3 border-r border-gray-200">
                                    {claim.evidenceUrl ? (
                                      <a
                                        href={claim.evidenceUrl}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="inline-flex items-center gap-1 text-brand-600 hover:underline font-bold"
                                      >
                                        <span>View Proof</span>
                                        <ExternalLink className="w-3 h-3" />
                                      </a>
                                    ) : (
                                      <span className="text-gray-400">No proof file attached</span>
                                    )}
                                  </td>
                                ))}
                              </tr>

                              {/* Admin Decisions */}
                              <tr className="bg-gray-50">
                                <td className="p-3 font-bold text-gray-900 border-r border-gray-200">Verification Actions</td>
                                {itemClaims.map((claim) => (
                                  <td key={claim.id} className="p-3 border-r border-gray-200">
                                    {claim.status === "APPROVED" ? (
                                      <span className="text-xs font-bold text-emerald-700 flex items-center gap-1">
                                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                                        Verified & Approved
                                      </span>
                                    ) : claim.status === "REJECTED" ? (
                                      <span className="text-xs font-bold text-rose-700 flex items-center gap-1">
                                        <X className="w-4 h-4 text-rose-600" />
                                        Claim Rejected
                                      </span>
                                    ) : (
                                      <div className="flex flex-col gap-2">
                                        <button
                                          onClick={() => {
                                            setSelectedClaimForAction(claim);
                                            setActionModalType("APPROVE");
                                            setAdminNoteInput(
                                              "Matched serial number and confirmed unique scratch mark."
                                            );
                                          }}
                                          className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-xs flex items-center justify-center gap-1"
                                        >
                                          <Check className="w-3.5 h-3.5" />
                                          Approve Claim
                                        </button>
                                        <div className="flex gap-1.5">
                                          <button
                                            onClick={() => {
                                              setSelectedClaimForAction(claim);
                                              setActionModalType("REQUEST_INFO");
                                              setAdminNoteInput("Please provide invoice or purchase serial receipt.");
                                            }}
                                            className="flex-1 px-2 py-1 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 font-semibold rounded-lg text-[11px]"
                                          >
                                            Request Info
                                          </button>
                                          <button
                                            onClick={() => {
                                              setSelectedClaimForAction(claim);
                                              setActionModalType("REJECT");
                                              setAdminNoteInput("Details do not match physical recovered item.");
                                            }}
                                            className="flex-1 px-2 py-1 bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-200 font-semibold rounded-lg text-[11px]"
                                          >
                                            Reject
                                          </button>
                                        </div>
                                      </div>
                                    )}
                                  </td>
                                ))}
                              </tr>
                            </tbody>
                          </table>
                        </div>
                      </div>
                    ) : (
                      /* Single Claim Display */
                      <div className="p-6">
                        {itemClaims.map((claim) => (
                          <div key={claim.id} className="space-y-4">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                              <div>
                                <h4 className="font-bold text-sm text-gray-900">
                                  Claimant: {claim.claimant.name} ({claim.claimant.organization || claim.claimant.email})
                                </h4>
                                <span className="text-xs text-gray-500">
                                  Contact Phone: {claim.claimant.phone || "Not provided"} • Submitted on {new Date(claim.createdAt).toLocaleDateString()}
                                </span>
                              </div>
                              <span
                                className={`px-3 py-1 rounded-full text-xs font-bold border self-start sm:self-auto ${
                                  STATUS_LABELS[claim.status]?.bg
                                } ${STATUS_LABELS[claim.status]?.text} ${
                                  STATUS_LABELS[claim.status]?.border
                                }`}
                              >
                                {STATUS_LABELS[claim.status]?.label || claim.status}
                              </span>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs bg-gray-50 p-4 rounded-2xl">
                              <div>
                                <span className="text-gray-400 block">Where lost:</span>
                                <span className="font-semibold text-gray-800">{claim.lostLocation}</span>
                              </div>
                              <div>
                                <span className="text-gray-400 block">When lost:</span>
                                <span className="font-semibold text-gray-800">{claim.lostTime}</span>
                              </div>
                              <div>
                                <span className="text-gray-400 block">Exact Model:</span>
                                <span className="font-semibold text-gray-800">{claim.exactModel || "Unspecified"}</span>
                              </div>
                              <div>
                                <span className="text-gray-400 block">Serial Number:</span>
                                <span className="font-semibold text-gray-800">{claim.serialNumber || "Unspecified"}</span>
                              </div>
                              <div className="sm:col-span-2">
                                <span className="text-gray-400 block">Unique Marks & Description:</span>
                                <span className="text-gray-800 leading-relaxed">{claim.description} {claim.uniqueMarks ? `(${claim.uniqueMarks})` : ""}</span>
                              </div>
                            </div>

                            {/* Action Buttons for Single Claim */}
                            {claim.status !== "APPROVED" && claim.status !== "REJECTED" && (
                              <div className="flex items-center gap-2 pt-2">
                                <button
                                  onClick={() => {
                                    setSelectedClaimForAction(claim);
                                    setActionModalType("APPROVE");
                                    setAdminNoteInput("Ownership credentials validated.");
                                  }}
                                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl flex items-center gap-1.5"
                                >
                                  <Check className="w-4 h-4" />
                                  Approve Claim
                                </button>
                                <button
                                  onClick={() => {
                                    setSelectedClaimForAction(claim);
                                    setActionModalType("REQUEST_INFO");
                                    setAdminNoteInput("Please provide additional proof of purchase.");
                                  }}
                                  className="px-4 py-2 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 font-semibold text-xs rounded-xl"
                                >
                                  Request More Info
                                </button>
                                <button
                                  onClick={() => {
                                    setSelectedClaimForAction(claim);
                                    setActionModalType("REJECT");
                                    setAdminNoteInput("Criteria not met.");
                                  }}
                                  className="px-4 py-2 bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-200 font-semibold text-xs rounded-xl"
                                >
                                  Reject Claim
                                </button>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: ALL REPORTS MANAGEMENT                                            */}
      {/* ========================================================================= */}
      {activeTab === "reports" && (
        <div className="space-y-6">
          {/* Controls */}
          <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-gray-500">Report Type:</span>
              <button
                onClick={() => setReportTypeFilter("ALL")}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold ${
                  reportTypeFilter === "ALL" ? "bg-purple-600 text-white" : "bg-gray-100 text-gray-600"
                }`}
              >
                All Reports
              </button>
              <button
                onClick={() => setReportTypeFilter("LOST")}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold ${
                  reportTypeFilter === "LOST" ? "bg-rose-600 text-white" : "bg-gray-100 text-gray-600"
                }`}
              >
                Lost Only
              </button>
              <button
                onClick={() => setReportTypeFilter("FOUND")}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold ${
                  reportTypeFilter === "FOUND" ? "bg-emerald-600 text-white" : "bg-gray-100 text-gray-600"
                }`}
              >
                Found Only
              </button>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="text"
                value={reportSearch}
                onChange={(e) => setReportSearch(e.target.value)}
                placeholder="Search reports..."
                className="px-3 py-1.5 text-xs rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-500/20"
              />
              <button
                onClick={fetchReports}
                className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold rounded-xl"
              >
                Filter
              </button>
            </div>
          </div>

          {/* Reports Table */}
          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-gray-50 text-gray-500 border-b border-gray-100">
                  <tr>
                    <th className="p-4">Report ID / Type</th>
                    <th className="p-4">Item Name</th>
                    <th className="p-4">Category</th>
                    <th className="p-4">Reporter</th>
                    <th className="p-4">Location & Date</th>
                    <th className="p-4">Status</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {[...reports.lostItems, ...reports.foundItems].map((rep) => {
                    const statusInfo = STATUS_LABELS[rep.status] || STATUS_LABELS.SEARCHING;
                    const isLost = rep.reportType === "LOST";

                    return (
                      <tr key={rep.id} className="hover:bg-gray-50/60 transition-colors">
                        <td className="p-4">
                          <span className="font-mono font-bold text-gray-900 block">{rep.reportId}</span>
                          <span
                            className={`inline-block mt-0.5 px-2 py-0.5 rounded text-[10px] font-bold ${
                              isLost ? "bg-rose-100 text-rose-700" : "bg-emerald-100 text-emerald-700"
                            }`}
                          >
                            {isLost ? "LOST" : "FOUND"}
                          </span>
                        </td>
                        <td className="p-4 font-bold text-gray-900">{rep.itemName}</td>
                        <td className="p-4 text-gray-600">{rep.category}</td>
                        <td className="p-4">
                          <span className="font-semibold text-gray-800 block">{rep.user?.name}</span>
                          <span className="text-[11px] text-gray-400">{rep.user?.email}</span>
                        </td>
                        <td className="p-4 text-gray-600">
                          <div>{rep.location}</div>
                          <div className="text-[11px] text-gray-400">{rep.lostDate || rep.foundDate}</div>
                        </td>
                        <td className="p-4">
                          <span
                            className={`px-2.5 py-1 rounded-full text-[11px] font-bold border ${statusInfo.bg} ${statusInfo.text} ${statusInfo.border}`}
                          >
                            {statusInfo.label}
                          </span>
                        </td>
                        <td className="p-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Link
                              href={`/items/${rep.id}`}
                              className="p-1.5 text-gray-400 hover:text-brand-600 hover:bg-brand-50 rounded-lg transition-colors"
                              title="Inspect Item"
                            >
                              <ExternalLink className="w-4 h-4" />
                            </Link>
                            <button
                              onClick={() =>
                                setDeleteConfirmTarget({
                                  id: rep.id,
                                  type: isLost ? "LOST" : "FOUND",
                                  name: rep.itemName,
                                })
                              }
                              className="p-1.5 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                              title="Delete Report"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: CLAIM ACTION (Approve / Reject / Request Info)                      */}
      {/* ========================================================================= */}
      {actionModalType && selectedClaimForAction && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-gray-100">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h3 className="font-extrabold text-base text-gray-900">
                {actionModalType === "APPROVE" && "Approve Ownership Claim"}
                {actionModalType === "REJECT" && "Reject Ownership Claim"}
                {actionModalType === "REQUEST_INFO" && "Request Additional Information"}
              </h3>
              <button
                onClick={() => setActionModalType(null)}
                className="p-1 text-gray-400 hover:text-gray-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-gray-600">
              Claimant: <strong>{selectedClaimForAction.claimant?.name}</strong> <br />
              Item: <strong>{selectedClaimForAction.foundItem?.itemName}</strong>
            </p>

            {actionModalType === "APPROVE" && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800">
                ⚠️ Approving this claim will verify ownership and automatically notify other competing claimants that their claims have been rejected.
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                {actionModalType === "REQUEST_INFO"
                  ? "Question / Required Documents for Claimant *"
                  : "Administrator Notes / Reason"}
              </label>
              <textarea
                rows={3}
                required={actionModalType === "REQUEST_INFO"}
                value={adminNoteInput}
                onChange={(e) => setAdminNoteInput(e.target.value)}
                placeholder="Enter verification notes or inquiry message..."
                className="w-full px-3 py-2 text-xs rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-500/20"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-gray-100">
              <button
                type="button"
                onClick={() => setActionModalType(null)}
                className="px-4 py-2 text-xs font-semibold text-gray-600 hover:text-gray-800"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={submittingAction}
                onClick={handleExecuteClaimAction}
                className={`px-5 py-2 text-xs font-bold text-white rounded-xl shadow-sm flex items-center gap-1.5 ${
                  actionModalType === "APPROVE"
                    ? "bg-emerald-600 hover:bg-emerald-700"
                    : actionModalType === "REJECT"
                    ? "bg-rose-600 hover:bg-rose-700"
                    : "bg-amber-600 hover:bg-amber-700"
                }`}
              >
                {submittingAction && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                Confirm Decision
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: COMPLETE RECOVERY HANDOVER                                        */}
      {/* ========================================================================= */}
      {recoveryModalItem && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-gray-100">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h3 className="font-extrabold text-base text-gray-900 flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                Complete Recovery Handover
              </h3>
              <button
                onClick={() => setRecoveryModalItem(null)}
                className="p-1 text-gray-400 hover:text-gray-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2 text-xs text-gray-600">
              <p>
                Item: <strong>{recoveryModalItem.itemName}</strong>
              </p>
              <p>
                Claimant: <strong>{recoveryModalItem.claimantName}</strong>
              </p>
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800">
                This action transitions the item to <strong>RECOVERED</strong> status and logs an immutable audit recovery record.
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                Handover Notes & ID Verification Reference
              </label>
              <textarea
                rows={3}
                value={handoverNotes}
                onChange={(e) => setHandoverNotes(e.target.value)}
                placeholder="e.g. Verified student photo ID card #2024-CS-091. Handover completed at security desk."
                className="w-full px-3 py-2 text-xs rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-gray-100">
              <button
                type="button"
                onClick={() => setRecoveryModalItem(null)}
                className="px-4 py-2 text-xs font-semibold text-gray-600 hover:text-gray-800"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={submittingRecovery}
                onClick={handleExecuteRecovery}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-md flex items-center gap-1.5"
              >
                {submittingRecovery && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                Finalize Handover (Mark Recovered)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: DELETE CONFIRMATION                                               */}
      {/* ========================================================================= */}
      {deleteConfirmTarget && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 space-y-4 shadow-2xl border border-gray-100 text-center">
            <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h3 className="font-extrabold text-base text-gray-900">
              Confirm Report Deletion
            </h3>
            <p className="text-xs text-gray-500">
              Are you sure you want to remove <strong>"{deleteConfirmTarget.name}"</strong>? This destructive action cannot be undone.
            </p>
            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                onClick={() => setDeleteConfirmTarget(null)}
                className="px-4 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-100 rounded-xl"
              >
                Cancel
              </button>
              <button
                onClick={handleExecuteDelete}
                className="px-5 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-md"
              >
                Delete Report
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
