import Link from "next/link";
import {
  Search,
  PlusCircle,
  FileQuestion,
  ShieldCheck,
  ArrowRight,
  MapPin,
  Calendar,
  Sparkles,
  Tag,
  CheckCircle2,
} from "lucide-react";
import prisma from "@/lib/prisma";
import { ensureDatabaseReady } from "@/lib/db-init";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  await ensureDatabaseReady().catch(() => {});

  let recentFoundItems: any[] = [];
  let lostCount = 0;
  let foundCount = 0;
  let recoveredCount = 0;

  try {
    const [lost, found, recovered] = await Promise.all([
      prisma.lostItem.count().catch(() => 0),
      prisma.foundItem.count().catch(() => 0),
      prisma.foundItem.count({ where: { status: "RECOVERED" } }).catch(() => 0),
    ]);
    lostCount = lost;
    foundCount = found;
    recoveredCount = recovered;

    recentFoundItems = await prisma.foundItem.findMany({
      take: 6,
      orderBy: { createdAt: "desc" },
      where: { status: { notIn: ["RECOVERED", "CLOSED"] } },
    }).catch(() => []);
  } catch (error) {
    console.error("Home page database query handled safely:", error);
  }

  return (
    <div className="space-y-16 pb-16">
      {/* 1. Hero Section with Live Search */}
      <section className="pt-10 sm:pt-16 pb-8 bg-gradient-to-b from-indigo-50/70 via-slate-50/50 to-transparent">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center space-y-6">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-100 text-indigo-700 text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Centralized Campus Lost & Found</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-slate-900 leading-tight">
            Lost or found something <br className="hidden sm:block" />
            on campus?
          </h1>

          <p className="text-slate-600 text-sm sm:text-base max-w-lg mx-auto">
            Search our verified database or submit a report in under two minutes.
          </p>

          {/* Prominent Search Bar */}
          <form
            action="/items"
            method="GET"
            className="max-w-xl mx-auto flex items-center bg-white rounded-2xl shadow-lg shadow-slate-200/60 border border-slate-200 p-2 gap-2"
          >
            <div className="flex items-center pl-3 flex-1">
              <Search className="w-5 h-5 text-slate-400 mr-2" />
              <input
                type="text"
                name="q"
                placeholder="Search keys, wallet, phone, earbuds, ID card..."
                className="w-full text-sm bg-transparent outline-hidden text-slate-800 placeholder-slate-400"
              />
            </div>
            <button
              type="submit"
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition-colors shadow-xs"
            >
              Search
            </button>
          </form>

          {/* Quick Filter Tags */}
          <div className="flex flex-wrap items-center justify-center gap-2 text-xs text-slate-500 pt-1">
            <span className="font-medium text-slate-400">Popular:</span>
            {["Electronics", "ID Cards", "Wallets", "Keys", "Chargers"].map((tag) => (
              <Link
                key={tag}
                href={`/items?category=${encodeURIComponent(tag)}`}
                className="px-2.5 py-1 bg-white hover:bg-indigo-50 hover:text-indigo-600 border border-slate-200 rounded-full transition-colors"
              >
                {tag}
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* 2. Two Big Obvious Choices: Lost vs Found */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Card A: I Lost Something */}
          <div className="bg-gradient-to-br from-rose-50 to-orange-50/30 rounded-3xl p-6 sm:p-8 border border-rose-100 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between space-y-6">
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center">
                <FileQuestion className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-slate-900">I Lost Something</h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                Report your missing belonging with a description and location. Our system continuously searches for matches.
              </p>
            </div>
            <Link
              href="/report/lost"
              className="w-full py-3 px-4 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold text-center shadow-sm flex items-center justify-center gap-2 transition-colors"
            >
              <span>Report Lost Item</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {/* Card B: I Found Something */}
          <div className="bg-gradient-to-br from-emerald-50 to-teal-50/30 rounded-3xl p-6 sm:p-8 border border-emerald-100 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between space-y-6">
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center">
                <PlusCircle className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-slate-900">I Found Something</h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                Picked up an unattended belonging? List where it was found or which security desk you handed it over to.
              </p>
            </div>
            <Link
              href="/report/found"
              className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold text-center shadow-sm flex items-center justify-center gap-2 transition-colors"
            >
              <span>Report Found Item</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* 3. Recently Found Items Feed */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-slate-900">Recently Found on Campus</h2>
            <p className="text-xs text-slate-500">Check if your lost belonging has already been turned in.</p>
          </div>
          <Link
            href="/items"
            className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
          >
            <span>View All ({foundCount})</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {recentFoundItems.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center text-xs text-slate-400">
            No found items currently listed.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {recentFoundItems.map((item) => (
              <div
                key={item.id}
                className="bg-white rounded-2xl border border-slate-200 shadow-xs hover:shadow-md transition-all flex flex-col overflow-hidden group"
              >
                <div className="h-44 bg-slate-100 relative overflow-hidden">
                  {item.imageUrl ? (
                    <img
                      src={item.imageUrl}
                      alt={item.itemName}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-slate-300">
                      <Tag className="w-8 h-8" />
                      <span className="text-[10px] mt-1">No photo</span>
                    </div>
                  )}
                  <span className="absolute top-2.5 left-2.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-white/90 backdrop-blur-xs text-slate-700 shadow-xs">
                    {item.category}
                  </span>
                </div>

                <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                  <div>
                    <h3 className="font-bold text-sm text-slate-900 line-clamp-1 group-hover:text-indigo-600 transition-colors">
                      {item.itemName}
                    </h3>
                    <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                      <span className="truncate">{item.location}</span>
                    </p>
                  </div>

                  <Link
                    href={`/items/${item.id}`}
                    className="w-full py-2 bg-slate-50 hover:bg-indigo-600 hover:text-white text-slate-700 text-xs font-bold rounded-xl text-center transition-colors"
                  >
                    View & Claim
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* 4. Simple 3-Step Guide */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6">
        <div className="bg-slate-50 rounded-3xl p-8 border border-slate-200/80 text-center space-y-6">
          <div>
            <h2 className="text-lg font-bold text-slate-900">How LostLink Works</h2>
            <p className="text-xs text-slate-500">Simple, verified, and safe recovery in 3 steps</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-left">
            <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs space-y-2">
              <span className="w-7 h-7 rounded-xl bg-indigo-100 text-indigo-700 font-bold text-xs flex items-center justify-center">
                1
              </span>
              <h4 className="font-bold text-sm text-slate-900">1. Report</h4>
              <p className="text-xs text-slate-500 leading-relaxed">
                Log what you lost or found with photos and drop-off notes.
              </p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs space-y-2">
              <span className="w-7 h-7 rounded-xl bg-indigo-100 text-indigo-700 font-bold text-xs flex items-center justify-center">
                2
              </span>
              <h4 className="font-bold text-sm text-slate-900">2. Match & Claim</h4>
              <p className="text-xs text-slate-500 leading-relaxed">
                Find your item or get match alerts, then answer verification questions.
              </p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs space-y-2">
              <span className="w-7 h-7 rounded-xl bg-indigo-100 text-indigo-700 font-bold text-xs flex items-center justify-center">
                3
              </span>
              <h4 className="font-bold text-sm text-slate-900">3. Verify & Collect</h4>
              <p className="text-xs text-slate-500 leading-relaxed">
                Security desk checks ownership credentials and hands over your belongings.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
