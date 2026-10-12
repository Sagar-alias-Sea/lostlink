"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/components/auth-context";
import {
  ShieldCheck,
  Upload,
  AlertCircle,
  CheckCircle2,
  ArrowLeft,
  ArrowRight,
  FileText,
  Loader2,
  Lock,
  Layers,
  Image as ImageIcon,
} from "lucide-react";

export default function ClaimPage() {
  const params = useParams();
  const router = useRouter();
  const foundItemId = params?.id as string;
  const { user } = useAuth();

  const [foundItem, setFoundItem] = useState<any>(null);
  const [loadingItem, setLoadingItem] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // 7-question verification state
  const [formData, setFormData] = useState({
    description: "",
    lostLocation: "",
    lostTime: "",
    uniqueMarks: "",
    accessories: "",
    exactModel: "",
    serialNumber: "",
    identifyingInfo: "",
    evidenceUrl: "",
  });

  useEffect(() => {
    if (foundItemId) {
      fetchItem();
    }
  }, [foundItemId]);

  const fetchItem = async () => {
    try {
      setLoadingItem(true);
      const res = await fetch(`/api/items/${foundItemId}`);
      if (!res.ok) {
        setError("Found item not found.");
        return;
      }
      const data = await res.json();
      setFoundItem(data.item);

      if (data.userClaim) {
        setError("You have already submitted an ownership claim for this item.");
      }
    } catch {
      setError("Failed to load item information.");
    } finally {
      setLoadingItem(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setError(null);
    try {
      const data = new FormData();
      data.append("file", file);

      const res = await fetch("/api/upload", {
        method: "POST",
        body: data,
      });

      const resData = await res.json();
      if (!res.ok) {
        setError(resData.error || "Failed to upload evidence.");
        return;
      }

      setFormData((prev) => ({ ...prev, evidenceUrl: resData.url }));
    } catch {
      setError("Evidence upload failed. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!formData.description || !formData.lostLocation || !formData.lostTime) {
      setError("Please fill in the required verification questions marked with *.");
      return;
    }

    setSubmitting(true);

    try {
      const res = await fetch("/api/claims", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          foundItemId,
          ...formData,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to submit claim.");
        setSubmitting(false);
        return;
      }

      setSuccess(true);
    } catch {
      setError("Network error while submitting claim.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loadingItem) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center animate-pulse space-y-4">
        <div className="h-40 bg-gray-200 rounded-3xl w-full" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {success ? (
        <div className="bg-white rounded-3xl p-8 sm:p-12 border border-gray-100 shadow-xl text-center space-y-6">
          <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
            <CheckCircle2 className="w-9 h-9" />
          </div>

          <div className="space-y-2">
            <h2 className="text-2xl font-black text-gray-900">
              Ownership Claim Submitted
            </h2>
            <p className="text-sm text-gray-500 max-w-md mx-auto">
              Your claim will be reviewed by campus administrators before the item is returned. If there are competing claims, details and evidence will be evaluated side-by-side.
            </p>
          </div>

          <div className="p-4 bg-indigo-50 border border-indigo-200 rounded-2xl text-xs text-indigo-800 text-left space-y-1">
            <span className="font-bold block">Next Steps in Verification:</span>
            <p>1. Administrator compares your description, serial number, and evidence against the physical item.</p>
            <p>2. If verified, you will receive an in-app notification and the item status will change to "Ready for Recovery".</p>
            <p>3. Bring a valid photo ID to the administrative security desk to collect your belonging.</p>
          </div>

          <div className="flex justify-center gap-3 pt-4 border-t border-gray-100">
            <Link
              href="/dashboard"
              className="px-5 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-semibold"
            >
              Go to Dashboard
            </Link>
            <Link
              href="/my-reports?tab=claims"
              className="px-5 py-2.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-semibold"
            >
              View My Claims
            </Link>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 sm:p-10 space-y-8">
          {/* Header */}
          <div className="border-b border-gray-100 pb-6 space-y-3">
            <Link
              href={`/items/${foundItemId}`}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-500 hover:text-gray-900"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Item
            </Link>

            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-brand-600 flex items-center justify-center flex-shrink-0">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-2xl font-black text-gray-900 tracking-tight">
                  Ownership Verification Claim
                </h1>
                <p className="text-xs text-gray-500">
                  Claiming: <strong className="text-gray-800">{foundItem?.itemName}</strong> ({foundItem?.reportId})
                </p>
              </div>
            </div>

            {/* Warning callout */}
            <div className="p-3.5 bg-amber-50 border border-amber-200/80 rounded-2xl text-xs text-amber-800 flex items-start gap-2">
              <Lock className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
              <span>
                <strong>Your claim will be reviewed before the item is returned.</strong> To protect rightful owners, answer as specifically as possible. False claims are reported to campus administration.
              </span>
            </div>
          </div>

          {error && (
            <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="text-xs font-bold uppercase tracking-wider text-brand-600">
              7-Point Verification Questionnaire
            </div>

            {/* Q1: Describe in detail */}
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                1. Describe the item in detail *
              </label>
              <textarea
                rows={3}
                required
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Exact color shades, textures, materials, packaging, stickers, condition..."
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
              />
            </div>

            {/* Q2 & Q3: Where & When lost */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  2. Where did you lose it? *
                </label>
                <input
                  type="text"
                  required
                  value={formData.lostLocation}
                  onChange={(e) => setFormData({ ...formData, lostLocation: e.target.value })}
                  placeholder="e.g. Central Library 2nd floor desk #14"
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  3. Approximately when did you lose it? *
                </label>
                <input
                  type="text"
                  required
                  value={formData.lostTime}
                  onChange={(e) => setFormData({ ...formData, lostTime: e.target.value })}
                  placeholder="e.g. Tuesday Sept 15, around 11:00 AM"
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                />
              </div>
            </div>

            {/* Q4: Unique Marks */}
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                4. What unique marks, scratches, or wear does it have?
              </label>
              <textarea
                rows={2}
                value={formData.uniqueMarks}
                onChange={(e) => setFormData({ ...formData, uniqueMarks: e.target.value })}
                placeholder="e.g. 1cm diagonal scratch on underside, chipped right corner, specific decal..."
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
              />
            </div>

            {/* Q5: Accessories */}
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                5. What accessories came with it or were attached?
              </label>
              <input
                type="text"
                value={formData.accessories}
                onChange={(e) => setFormData({ ...formData, accessories: e.target.value })}
                placeholder="e.g. Black silicone protective case, red charging cable, keychain..."
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
              />
            </div>

            {/* Q6 & Q7: Exact Model & Serial Number */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  6. What is the exact model / version?
                </label>
                <input
                  type="text"
                  value={formData.exactModel}
                  onChange={(e) => setFormData({ ...formData, exactModel: e.target.value })}
                  placeholder="e.g. Model E508A or ScanSmart 1900"
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  7. Serial Number or Unique ID (if known)
                </label>
                <input
                  type="text"
                  value={formData.serialNumber}
                  onChange={(e) => setFormData({ ...formData, serialNumber: e.target.value })}
                  placeholder="e.g. SN: OP-NB2-2025-8892 or IMEI ending in 4021"
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                />
              </div>
            </div>

            {/* Additional Private Identifying Info */}
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                Additional Confidential Ownership Information
              </label>
              <textarea
                rows={2}
                value={formData.identifyingInfo}
                onChange={(e) => setFormData({ ...formData, identifyingInfo: e.target.value })}
                placeholder="e.g. Bluetooth device name, paired account email, lock screen wallpaper description, contents of wallet..."
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
              />
            </div>

            {/* Evidence Upload */}
            <div className="pt-2">
              <label className="block text-xs font-bold text-gray-700 mb-1">
                Optional Ownership Proof (Purchase invoice, warranty doc, previous photo, packaging)
              </label>
              <div className="flex flex-col sm:flex-row items-center gap-4">
                <label className="w-full sm:w-auto px-4 py-2.5 rounded-xl border-2 border-dashed border-gray-300 hover:border-brand-500 text-gray-600 hover:text-brand-600 text-xs font-semibold cursor-pointer flex items-center justify-center gap-2 transition-colors">
                  <Upload className="w-4 h-4" />
                  <span>{uploading ? "Uploading..." : "Upload Evidence / Receipt"}</span>
                  <input
                    type="file"
                    accept="image/*,application/pdf"
                    onChange={handleFileUpload}
                    className="hidden"
                    disabled={uploading}
                  />
                </label>

                {formData.evidenceUrl && (
                  <div className="flex items-center gap-2 text-xs text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200">
                    <FileText className="w-4 h-4" />
                    <span>Evidence attached</span>
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, evidenceUrl: "" })}
                      className="ml-2 text-rose-500 hover:underline"
                    >
                      Remove
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="pt-6 border-t border-gray-100 flex items-center justify-end gap-3">
              <Link
                href={`/items/${foundItemId}`}
                className="px-5 py-2.5 text-xs font-semibold text-gray-600 hover:text-gray-800"
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={submitting || uploading}
                className="px-7 py-3 rounded-xl bg-gradient-to-r from-brand-600 via-indigo-600 to-accent-600 hover:from-brand-700 hover:to-accent-700 text-white font-bold text-xs shadow-md shadow-indigo-200 disabled:opacity-50 flex items-center gap-2 transition-all"
              >
                {submitting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <span>Submit Verification Claim</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
