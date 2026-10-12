import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSessionFromRequest } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const session = await getSessionFromRequest(req);
    if (!session || session.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized. Admin access required." }, { status: 403 });
    }

    const [
      totalUsers,
      totalLostReports,
      totalFoundReports,
      totalClaims,
      pendingClaims,
      recoveredFound,
      recoveredLost,
    ] = await Promise.all([
      prisma.user.count({ where: { role: "USER" } }),
      prisma.lostItem.count(),
      prisma.foundItem.count(),
      prisma.claim.count(),
      prisma.claim.count({ where: { status: { in: ["SUBMITTED", "UNDER_REVIEW"] } } }),
      prisma.foundItem.count({ where: { status: "RECOVERED" } }),
      prisma.lostItem.count({ where: { status: "RECOVERED" } }),
    ]);

    const totalReports = totalLostReports + totalFoundReports;
    const totalRecovered = recoveredFound + recoveredLost;
    const recoveryRate = totalReports > 0 ? Math.round((totalRecovered / totalReports) * 100) : 0;

    // Multiple claims count (found items with > 1 claim)
    const itemsWithClaims = await prisma.foundItem.findMany({
      select: {
        id: true,
        _count: {
          select: { claims: true },
        },
      },
    });
    const multipleClaimsCount = itemsWithClaims.filter((i) => i._count.claims > 1).length;

    // Category breakdown
    const lostByCategory = await prisma.lostItem.groupBy({
      by: ["category"],
      _count: { id: true },
    });
    const foundByCategory = await prisma.foundItem.groupBy({
      by: ["category"],
      _count: { id: true },
    });

    const categoryMap: Record<string, { lost: number; found: number }> = {};
    lostByCategory.forEach((c) => {
      categoryMap[c.category] = { lost: c._count.id, found: 0 };
    });
    foundByCategory.forEach((c) => {
      if (!categoryMap[c.category]) {
        categoryMap[c.category] = { lost: 0, found: c._count.id };
      } else {
        categoryMap[c.category].found = c._count.id;
      }
    });

    const categoryBreakdown = Object.entries(categoryMap).map(([cat, counts]) => ({
      category: cat,
      lost: counts.lost,
      found: counts.found,
      total: counts.lost + counts.found,
    }));

    // Top locations
    const foundLocations = await prisma.foundItem.groupBy({
      by: ["location"],
      _count: { id: true },
      take: 5,
      orderBy: { _count: { id: "desc" } },
    });

    return NextResponse.json({
      stats: {
        totalUsers,
        totalLostReports,
        totalFoundReports,
        totalReports,
        totalClaims,
        pendingClaims,
        multipleClaimsCount,
        totalRecovered,
        recoveryRate,
      },
      categoryBreakdown,
      topLocations: foundLocations.map((l) => ({ location: l.location, count: l._count.id })),
    });
  } catch (error) {
    console.error("Admin stats error:", error);
    return NextResponse.json({ error: "Failed to fetch admin stats" }, { status: 500 });
  }
}
