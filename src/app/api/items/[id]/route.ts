import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSessionFromRequest } from "@/lib/auth";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const session = await getSessionFromRequest(req);

    // Try finding in FoundItem first
    const foundItem = await prisma.foundItem.findUnique({
      where: { id },
      include: {
        _count: {
          select: { claims: true },
        },
        user: {
          select: {
            id: true,
            name: true,
            organization: true,
          },
        },
        claims: session
          ? {
              where: { claimantId: session.userId },
              select: {
                id: true,
                status: true,
                createdAt: true,
                adminNotes: true,
              },
            }
          : false,
      },
    });

    if (foundItem) {
      const userClaim = (foundItem.claims as any[])?.[0] || null;
      return NextResponse.json({
        type: "FOUND",
        item: {
          id: foundItem.id,
          reportId: foundItem.reportId,
          itemName: foundItem.itemName,
          category: foundItem.category,
          brand: foundItem.brand,
          model: foundItem.model,
          color: foundItem.color,
          description: foundItem.description,
          date: foundItem.foundDate,
          time: foundItem.foundTime,
          location: foundItem.location,
          additionalDetails: foundItem.additionalDetails,
          imageUrl: foundItem.imageUrl,
          status: foundItem.status,
          claimCount: foundItem._count.claims,
          createdAt: foundItem.createdAt,
          reportedBy: foundItem.user.organization || "Community Member",
          isOwner: session?.userId === foundItem.userId,
        },
        userClaim,
      });
    }

    // Try finding in LostItem
    const lostItem = await prisma.lostItem.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            organization: true,
          },
        },
      },
    });

    if (lostItem) {
      return NextResponse.json({
        type: "LOST",
        item: {
          id: lostItem.id,
          reportId: lostItem.reportId,
          itemName: lostItem.itemName,
          category: lostItem.category,
          brand: lostItem.brand,
          model: lostItem.model,
          color: lostItem.color,
          description: lostItem.description,
          date: lostItem.lostDate,
          time: lostItem.lostTime,
          location: lostItem.location,
          additionalDetails: lostItem.additionalDetails,
          imageUrl: lostItem.imageUrl,
          status: lostItem.status,
          claimCount: 0,
          createdAt: lostItem.createdAt,
          reportedBy: lostItem.user.organization || "Community Member",
          isOwner: session?.userId === lostItem.userId,
        },
        userClaim: null,
      });
    }

    return NextResponse.json({ error: "Item not found" }, { status: 404 });
  } catch (error) {
    console.error("Fetch item detail error:", error);
    return NextResponse.json({ error: "Failed to fetch item" }, { status: 500 });
  }
}
