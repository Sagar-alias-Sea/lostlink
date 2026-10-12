"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "./auth-context";
import {
  Link2,
  MapPin,
  Bell,
  Search,
  PlusCircle,
  FileQuestion,
  ShieldCheck,
  User,
  LogOut,
  Menu,
  X,
  CheckCheck,
  Sparkles,
} from "lucide-react";

export function Navbar() {
  const { user, logout } = useAuth();
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (user) {
      fetchNotifications();
    }
  }, [user, pathname]);

  const fetchNotifications = async () => {
    try {
      const res = await fetch("/api/notifications");
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.notifications || []);
        setUnreadCount(data.unreadCount || 0);
      }
    } catch {
      // ignore
    }
  };

  const markAllRead = async () => {
    try {
      await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ markAllAsRead: true }),
      });
      setUnreadCount(0);
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    } catch {
      // ignore
    }
  };

  const isActive = (path: string) => pathname === path;

  return (
    <nav className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-slate-100 shadow-xs">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="flex justify-between h-16 items-center">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2.5 group">
            <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-sm shadow-indigo-200 group-hover:scale-105 transition-transform">
              <div className="relative flex items-center justify-center">
                <Link2 className="w-4 h-4 -rotate-45" />
                <MapPin className="w-3 h-3 absolute -bottom-1 -right-1 text-amber-300" />
              </div>
            </div>
            <div className="flex flex-col">
              <span className="text-lg font-bold tracking-tight text-slate-900 leading-none">
                LostLink
              </span>
              <span className="text-[10px] text-slate-400 font-medium">
                Campus Lost & Found
              </span>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <div className="hidden md:flex items-center space-x-1">
            <Link
              href="/items"
              className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition-colors ${
                isActive("/items")
                  ? "text-indigo-600 bg-indigo-50"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
              }`}
            >
              Browse Items
            </Link>
            <Link
              href="/report/lost"
              className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition-colors ${
                isActive("/report/lost")
                  ? "text-rose-600 bg-rose-50"
                  : "text-slate-600 hover:text-rose-600 hover:bg-slate-50"
              }`}
            >
              Report Lost
            </Link>
            <Link
              href="/report/found"
              className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition-colors ${
                isActive("/report/found")
                  ? "text-emerald-600 bg-emerald-50"
                  : "text-slate-600 hover:text-emerald-600 hover:bg-slate-50"
              }`}
            >
              Report Found
            </Link>

            {user && (
              <Link
                href="/dashboard"
                className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition-colors ${
                  isActive("/dashboard") || isActive("/my-reports")
                    ? "text-indigo-600 bg-indigo-50"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                }`}
              >
                My Dashboard
              </Link>
            )}

            {user?.role === "ADMIN" && (
              <Link
                href="/admin"
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors ml-2 ${
                  pathname.startsWith("/admin")
                    ? "bg-purple-600 text-white shadow-xs"
                    : "bg-purple-50 text-purple-700 hover:bg-purple-100"
                }`}
              >
                🛡️ Admin Portal
              </Link>
            )}
          </div>

          {/* Right side: Notifications & Profile */}
          <div className="flex items-center space-x-2.5">
            {user ? (
              <>
                {/* Notifications Bell */}
                <div className="relative">
                  <button
                    onClick={() => setNotifOpen(!notifOpen)}
                    className="p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-full relative transition-colors"
                    aria-label="Notifications"
                  >
                    <Bell className="w-4 h-4" />
                    {unreadCount > 0 && (
                      <span className="absolute top-1 right-1 w-3.5 h-3.5 bg-rose-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center animate-pulse">
                        {unreadCount > 9 ? "9+" : unreadCount}
                      </span>
                    )}
                  </button>

                  {/* Dropdown */}
                  {notifOpen && (
                    <div className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-xl border border-slate-100 py-2.5 z-50 animate-in fade-in zoom-in-95">
                      <div className="px-4 pb-2 border-b border-slate-100 flex items-center justify-between">
                        <span className="font-semibold text-slate-900 text-xs">Notifications</span>
                        {unreadCount > 0 && (
                          <button
                            onClick={markAllRead}
                            className="text-[11px] text-indigo-600 hover:underline flex items-center gap-1 font-medium"
                          >
                            <CheckCheck className="w-3 h-3" />
                            Mark read
                          </button>
                        )}
                      </div>

                      <div className="max-h-64 overflow-y-auto divide-y divide-slate-50">
                        {notifications.length === 0 ? (
                          <div className="py-6 text-center text-slate-400 text-xs">
                            You're all caught up!
                          </div>
                        ) : (
                          notifications.slice(0, 5).map((n) => (
                            <Link
                              key={n.id}
                              href={n.linkUrl || "/my-reports"}
                              onClick={() => setNotifOpen(false)}
                              className={`block px-4 py-2.5 hover:bg-slate-50 transition-colors ${
                                !n.isRead ? "bg-indigo-50/40" : ""
                              }`}
                            >
                              <p className="text-xs font-semibold text-slate-900 truncate">
                                {n.title}
                              </p>
                              <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-1">
                                {n.message}
                              </p>
                            </Link>
                          ))
                        )}
                      </div>

                      <div className="px-4 pt-2 border-t border-slate-100 text-center">
                        <Link
                          href="/notifications"
                          onClick={() => setNotifOpen(false)}
                          className="text-[11px] text-indigo-600 hover:underline font-semibold"
                        >
                          View all notifications →
                        </Link>
                      </div>
                    </div>
                  )}
                </div>

                {/* User Info */}
                <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
                  <span className="text-xs font-semibold text-slate-800 hidden sm:inline">
                    {user.name.split(" ")[0]}
                  </span>
                  <button
                    onClick={logout}
                    title="Sign Out"
                    className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors text-xs flex items-center gap-1"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Exit</span>
                  </button>
                </div>
              </>
            ) : (
              <div className="flex items-center space-x-2">
                <Link
                  href="/login"
                  className="px-3.5 py-1.5 rounded-xl text-xs font-semibold text-slate-700 hover:text-slate-900 hover:bg-slate-100 transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  href="/register"
                  className="px-4 py-1.5 rounded-xl text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 shadow-sm transition-all"
                >
                  Sign Up
                </Link>
              </div>
            )}

            {/* Mobile toggle */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-xl text-slate-600 hover:bg-slate-100"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-100 bg-white px-4 py-3 space-y-1 shadow-lg">
          <Link
            href="/items"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 rounded-xl text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            🔍 Browse Found Items
          </Link>
          <Link
            href="/report/lost"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 rounded-xl text-sm font-medium text-rose-600 hover:bg-rose-50"
          >
            ❓ Report Lost Item
          </Link>
          <Link
            href="/report/found"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 rounded-xl text-sm font-medium text-emerald-600 hover:bg-emerald-50"
          >
            ➕ Report Found Item
          </Link>
          {user && (
            <>
              <Link
                href="/dashboard"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3 py-2 rounded-xl text-sm font-medium text-indigo-600 hover:bg-indigo-50"
              >
                📊 My Dashboard
              </Link>
              <Link
                href="/notifications"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3 py-2 rounded-xl text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                🔔 Notifications ({unreadCount})
              </Link>
              {user.role === "ADMIN" && (
                <Link
                  href="/admin"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block px-3 py-2 rounded-xl text-sm font-medium text-purple-700 bg-purple-50"
                >
                  🛡️ Admin Portal
                </Link>
              )}
              <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                <span className="text-xs text-slate-500">{user.email}</span>
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    logout();
                  }}
                  className="text-xs text-rose-600 font-semibold"
                >
                  Sign Out
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </nav>
  );
}
