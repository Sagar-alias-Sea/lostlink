"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/components/auth-context";
import {
  MapPin,
  Calendar,
  Tag,
  ShieldCheck,
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  Lock,
} from "lucide-react";
import { STATUS_LABELS } from "@/lib/constants";

export default function ItemDetailPage() {
  const params = useParams();
  const id = params?.id as string;
  const { user } = useAuth();

  const [data, setData] = useState<{
    type: "FOUND" | "LOST";
    item: any;
    userClaim: any;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (id) {
      fetchItem();
    }
  }, [id]);

  const fetchItem = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/items/${id}`);
      if (!res.ok) {
        setError("Item not found.");
        return;
      }
      const json = await res.json();
      setData(json);
    } catch {
      setError("Failed to load item details.");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center animate-pulse space-y-4">
        <div className="h-64 bg-slate-100 rounded-3xl w-full" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center space-y-4">
        <h2 className="text-xl font-bold text-slate-900">Item Not Found</h2>
        <Link
          href="/items"
          className="inline-block px-5 py-2.5 bg-indigo-600 text-white rounded-xl text-xs font-bold"
        >
          Return to Directory
        </Link>
      </div>
    );
  }

  const { item, type, userClaim } = data;
  const statusInfo = STATUS_LABELS[item.status] || STATUS_LABELS.REPORTED;
  const isMultiClaim = item.claimCount > 1;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      <Link
        href="/items"
        className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-slate-900"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Items
      </Link>

      <div className="bg-white rounded-3xl border border-slate-200 shadow-xs p-6 sm:p-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Photo */}
          <div className="space-y-3">
            <div className="w-full h-72 sm:h-80 rounded-2xl bg-slate-100 overflow-hidden border border-slate-100">
              {item.imageUrl ? (
                <img
                  src={item.imageUrl}
                  alt={item.itemName}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center text-slate-300">
                  <Tag className="w-12 h-12" />
                  <span className="text-xs mt-1">No photo uploaded</span>
                </div>
              )}
            </div>

            <div className="p-3 bg-slate-50 rounded-xl text-xs text-slate-500 flex items-center gap-2">
              <Lock className="w-4 h-4 text-slate-400 flex-shrink-0" />
              <span>Contact details are kept private to protect owners.</span>
            </div>
          </div>

          {/* Details */}
          <div className="flex flex-col justify-between space-y-5">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700">
                  {item.category}
                </span>
                <span className="font-mono text-xs text-slate-400 font-bold">
                  {item.reportId}
                </span>
              </div>

              <h1 className="text-2xl font-bold text-slate-900 leading-tight">
                {item.itemName}
              </h1>

              {/* Status banner */}
              {isMultiClaim && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 font-medium">
                  ⚠️ Multiple people have claimed this item. Admin verification will determine the verified owner.
                </div>
              )}

              {/* Location & Date */}
              <div className="space-y-2 text-xs text-slate-600 bg-slate-50 p-4 rounded-2xl">
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-slate-400" />
                  <span><strong>Location:</strong> {item.location}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-slate-400" />
                  <span>
                    <strong>Date {type === "FOUND" ? "Found" : "Lost"}:</strong> {item.date}
                  </span>
                </div>
                {item.brand && (
                  <div>
                    <strong>Brand:</strong> {item.brand} {item.model ? `(${item.model})` : ""}
                  </div>
                )}
                {item.color && (
                  <div>
                    <strong>Color:</strong> {item.color}
                  </div>
                )}
              </div>

              {/* Description */}
              <div>
                <span className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1">
                  Description
                </span>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                  {item.description}
                </p>
              </div>
            </div>

            {/* Claim Action */}
            <div className="pt-4 border-t border-slate-100">
              {type === "FOUND" ? (
                item.status === "RECOVERED" ? (
                  <div className="p-3 bg-emerald-50 text-emerald-800 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    Item Recovered & Returned
                  </div>
                ) : userClaim ? (
                  <div className="p-3.5 bg-indigo-50 border border-indigo-100 rounded-xl text-xs text-indigo-800 space-y-1">
                    <div className="flex items-center justify-between font-bold">
                      <span>Your Claim:</span>
                      <span className="px-2 py-0.5 bg-indigo-200 rounded-md">
                        {statusInfo.label}
                      </span>
                    </div>
                    <p className="text-[11px] text-indigo-600">
                      Your claim is in the verification queue.
                    </p>
                  </div>
                ) : (
                  <Link
                    href={`/claim/${item.id}`}
                    className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl text-center shadow-xs flex items-center justify-center gap-2 transition-colors"
                  >
                    <ShieldCheck className="w-4 h-4" />
                    <span>This is Mine — Claim Item</span>
                  </Link>
                )
              ) : (
                <div className="p-3 bg-slate-50 text-slate-600 rounded-xl text-xs text-center">
                  This is a lost report. Found this item?{" "}
                  <Link href="/report/found" className="text-indigo-600 font-bold underline">
                    Report it here
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
