import React from "react";
import Link from "next/link";
import { Link2, MapPin, Shield } from "lucide-react";

export function Footer() {
  return (
    <footer className="bg-white border-t border-slate-100 mt-20">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          {/* Brand */}
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-xl bg-indigo-600 flex items-center justify-center text-white">
              <Link2 className="w-4 h-4 -rotate-45" />
            </div>
            <div>
              <span className="font-bold text-slate-900 text-sm">LostLink</span>
              <p className="text-xs text-slate-400">Smart Lost & Found for Campuses & Workplaces</p>
            </div>
          </div>

          {/* Quick links */}
          <div className="flex flex-wrap items-center justify-center gap-6 text-xs font-medium text-slate-500">
            <Link href="/items" className="hover:text-indigo-600 transition-colors">
              Browse Directory
            </Link>
            <Link href="/report/lost" className="hover:text-indigo-600 transition-colors">
              Report Lost
            </Link>
            <Link href="/report/found" className="hover:text-indigo-600 transition-colors">
              Report Found
            </Link>
            <Link href="/login" className="hover:text-indigo-600 transition-colors">
              Sign In
            </Link>
          </div>

          <div className="flex items-center gap-1.5 text-xs text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-full border border-emerald-100 font-medium">
            <Shield className="w-3.5 h-3.5 text-emerald-600" />
            <span>Verified Handover Protocol</span>
          </div>
        </div>

        <div className="border-t border-slate-100 mt-8 pt-6 text-center text-xs text-slate-400">
          © {new Date().getFullYear()} LostLink. Ownership verified before item handover.
        </div>
      </div>
    </footer>
  );
}
