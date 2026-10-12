import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSessionFromRequest } from "@/lib/auth";
import { createNotification } from "@/lib/utils";

export async function POST(req: NextRequest) {
  try {
    const session = await getSessionFromRequest(req);
    if (!session || session.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized. Admin access required." }, { status: 403 });
    }

    const body = await req.json();
    const { foundItemId, claimId, handoverNotes } = body;

    if (!foundItemId || !claimId) {
      return NextResponse.json(
        { error: "foundItemId and claimId are required" },
        { status: 400 }
      );
    }

    const claim = await prisma.claim.findUnique({
      where: { id: claimId },
      include: { foundItem: true, claimant: true },
    });

    if (!claim) {
      return NextResponse.json({ error: "Claim not found" }, { status: 404 });
    }

    if (claim.status !== "APPROVED") {
      return NextResponse.json(
        { error: "Claim must be approved before marking item as recovered." },
        { status: 400 }
      );
    }

    // Check if already recovered
    const existingRecovery = await prisma.recoveryRecord.findUnique({
      where: { foundItemId },
    });

    if (existingRecovery) {
      return NextResponse.json(
        { error: "This item has already been marked as recovered." },
        { status: 400 }
      );
    }

    // 1. Create recovery record
    const recoveryRecord = await prisma.recoveryRecord.create({
      data: {
        foundItemId,
        claimId,
        approvedById: session.userId,
        handoverNotes: handoverNotes || "Handover completed and photo ID verified.",
      },
    });

    // 2. Mark FoundItem RECOVERED
    await prisma.foundItem.update({
      where: { id: foundItemId },
      data: { status: "RECOVERED" },
    });

    // 3. If the claimant had a matching lost item, mark it recovered too!
    const matchingLostItem = await prisma.lostItem.findFirst({
      where: {
        userId: claim.claimantId,
        category: claim.foundItem.category,
        status: { in: ["SEARCHING", "POSSIBLE_MATCH", "CLAIM_PENDING", "UNDER_VERIFICATION", "VERIFIED"] },
      },
    });

    if (matchingLostItem) {
      await prisma.lostItem.update({
        where: { id: matchingLostItem.id },
        data: { status: "RECOVERED" },
      });
    }

    // 4. Send celebration notification to claimant
    await createNotification({
      userId: claim.claimantId,
      title: "Item Successfully Recovered! 🎉",
      message: `Your item "${claim.foundItem.itemName}" has been officially handed over and marked as RECOVERED. Thank you for using LostLink!`,
      type: "RECOVERY",
      linkUrl: "/my-reports",
    });

    return NextResponse.json({
      success: true,
      message: "Item marked as recovered successfully.",
      recoveryRecord,
    });
  } catch (error) {
    console.error("Recover item error:", error);
    return NextResponse.json({ error: "Failed to mark item recovered" }, { status: 500 });
  }
}
