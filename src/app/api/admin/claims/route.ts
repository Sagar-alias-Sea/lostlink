import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSessionFromRequest } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const session = await getSessionFromRequest(req);
    if (!session || session.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status"); // ALL, PENDING, APPROVED, REJECTED, MULTIPLE

    const where: any = {};
    if (status && status !== "ALL" && status !== "MULTIPLE") {
      if (status === "PENDING") {
        where.status = { in: ["SUBMITTED", "UNDER_REVIEW"] };
      } else {
        where.status = status;
      }
    }

    const claims = await prisma.claim.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        claimant: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            organization: true,
          },
        },
        foundItem: {
          include: {
            claims: {
              select: { id: true, status: true },
            },
          },
        },
      },
    });

    // If filter is MULTIPLE, only return claims whose foundItem has > 1 claim
    let filteredClaims = claims;
    if (status === "MULTIPLE") {
      filteredClaims = claims.filter((c) => c.foundItem.claims.length > 1);
    }

    return NextResponse.json({ claims: filteredClaims });
  } catch (error) {
    console.error("Admin claims error:", error);
    return NextResponse.json({ error: "Failed to fetch claims" }, { status: 500 });
  }
}
