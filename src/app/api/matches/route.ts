import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSessionFromRequest } from "@/lib/auth";
import { calculateMatchScore } from "@/lib/matching";

export async function GET(req: NextRequest) {
  try {
    const session = await getSessionFromRequest(req);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const lostItemId = searchParams.get("lostItemId");

    // Fetch user's active lost items
    const userLostItems = await prisma.lostItem.findMany({
      where: lostItemId
        ? { id: lostItemId, userId: session.userId }
        : { userId: session.userId, status: { notIn: ["RECOVERED", "CLOSED"] } },
    });

    // Fetch active found items
    const activeFoundItems = await prisma.foundItem.findMany({
      where: {
        status: { notIn: ["RECOVERED", "CLOSED"] },
      },
    });

    const matches: Array<{
      lostItem: any;
      foundItem: any;
      matchScore: number;
      factors: any;
      matchedPointsSummary: string[];
    }> = [];

    for (const lost of userLostItems) {
      for (const found of activeFoundItems) {
        const result = calculateMatchScore(
          {
            id: lost.id,
            itemName: lost.itemName,
            category: lost.category,
            brand: lost.brand,
            model: lost.model,
            color: lost.color,
            description: lost.description,
            location: lost.location,
            date: lost.lostDate,
          },
          {
            id: found.id,
            itemName: found.itemName,
            category: found.category,
            brand: found.brand,
            model: found.model,
            color: found.color,
            description: found.description,
            location: found.location,
            date: found.foundDate,
          }
        );

        // Consider score >= 40 a potential match
        if (result.score >= 40) {
          matches.push({
            lostItem: {
              id: lost.id,
              reportId: lost.reportId,
              itemName: lost.itemName,
              category: lost.category,
              brand: lost.brand,
              color: lost.color,
              lostDate: lost.lostDate,
              location: lost.location,
              imageUrl: lost.imageUrl,
            },
            foundItem: {
              id: found.id,
              reportId: found.reportId,
              itemName: found.itemName,
              category: found.category,
              brand: found.brand,
              color: found.color,
              foundDate: found.foundDate,
              location: found.location,
              imageUrl: found.imageUrl,
              status: found.status,
            },
            matchScore: result.score,
            factors: result.factors,
            matchedPointsSummary: result.matchedPointsSummary,
          });
        }
      }
    }

    // Sort by highest match score first
    matches.sort((a, b) => b.matchScore - a.matchScore);

    return NextResponse.json({ matches });
  } catch (error) {
    console.error("Match calculation error:", error);
    return NextResponse.json({ error: "Failed to compute matches" }, { status: 500 });
  }
}
