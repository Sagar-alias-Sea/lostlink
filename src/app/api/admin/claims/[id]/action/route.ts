import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSessionFromRequest } from "@/lib/auth";
import { createNotification } from "@/lib/utils";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSessionFromRequest(req);
    if (!session || session.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized. Admin access required." }, { status: 403 });
    }

    const { id } = params;
    const body = await req.json();
    const { action, adminNotes } = body; // action: "APPROVE" | "REJECT" | "REQUEST_INFO"

    const claim = await prisma.claim.findUnique({
      where: { id },
      include: {
        foundItem: {
          include: {
            claims: true,
          },
        },
        claimant: true,
      },
    });

    if (!claim) {
      return NextResponse.json({ error: "Claim not found" }, { status: 404 });
    }

    const foundItem = claim.foundItem;

    if (action === "APPROVE") {
      // 1. Mark this claim APPROVED
      const updatedClaim = await prisma.claim.update({
        where: { id },
        data: {
          status: "APPROVED",
          adminNotes: adminNotes || "Ownership verified by administration.",
          reviewedAt: new Date(),
        },
      });

      // 2. Reject all other pending claims on this item
      const rivalClaims = foundItem.claims.filter((c) => c.id !== id && c.status !== "REJECTED");
      for (const rival of rivalClaims) {
        await prisma.claim.update({
          where: { id: rival.id },
          data: {
            status: "REJECTED",
            adminNotes: "Ownership was verified for another claimant based on serial/evidence matching.",
            reviewedAt: new Date(),
          },
        });

        await createNotification({
          userId: rival.claimantId,
          title: "Claim Update — Ownership Verified for Another Claimant",
          message: `Your claim for "${foundItem.itemName}" could not be verified as primary ownership proof was matched with another claimant.`,
          type: "CLAIM_STATUS",
          linkUrl: "/my-reports",
        });
      }

      // 3. Update FoundItem status to READY_FOR_RECOVERY (or VERIFIED)
      await prisma.foundItem.update({
        where: { id: foundItem.id },
        data: { status: "READY_FOR_RECOVERY" },
      });

      // 4. Notify approved claimant
      await createNotification({
        userId: claim.claimantId,
        title: "Claim Approved! Ownership Verified",
        message: `Congratulations! Your ownership claim for "${foundItem.itemName}" has been officially verified. The item is now Ready for Recovery. Please visit the admin/security desk with a valid photo ID.`,
        type: "CLAIM_STATUS",
        linkUrl: "/my-reports",
      });

      return NextResponse.json({
        success: true,
        message: "Claim approved and ownership verified.",
        claim: updatedClaim,
      });
    }

    if (action === "REJECT") {
      const updatedClaim = await prisma.claim.update({
        where: { id },
        data: {
          status: "REJECTED",
          adminNotes: adminNotes || "Verification criteria not satisfied.",
          reviewedAt: new Date(),
        },
      });

      // If no other pending claims, set found item back to REPORTED
      const remainingPending = foundItem.claims.filter(
        (c) => c.id !== id && (c.status === "SUBMITTED" || c.status === "UNDER_REVIEW")
      );
      if (remainingPending.length === 0) {
        await prisma.foundItem.update({
          where: { id: foundItem.id },
          data: { status: "REPORTED" },
        });
      }

      await createNotification({
        userId: claim.claimantId,
        title: "Ownership Claim Not Verified",
        message: `Your ownership claim for "${foundItem.itemName}" could not be verified. Reason: ${adminNotes || "Details did not match the recovered item."}`,
        type: "CLAIM_STATUS",
        linkUrl: "/my-reports",
      });

      return NextResponse.json({
        success: true,
        message: "Claim rejected.",
        claim: updatedClaim,
      });
    }

    if (action === "REQUEST_INFO") {
      const updatedClaim = await prisma.claim.update({
        where: { id },
        data: {
          status: "MORE_INFO_REQUIRED",
          adminNotes: adminNotes || "Please provide additional proof of ownership.",
          reviewedAt: new Date(),
        },
      });

      await createNotification({
        userId: claim.claimantId,
        title: "Additional Information Required for Verification",
        message: `The administrator reviewing your claim for "${foundItem.itemName}" has requested additional details: "${adminNotes}"`,
        type: "INFO_REQUEST",
        linkUrl: "/my-reports",
      });

      return NextResponse.json({
        success: true,
        message: "Information request sent to claimant.",
        claim: updatedClaim,
      });
    }

    return NextResponse.json({ error: "Invalid action specified." }, { status: 400 });
  } catch (error) {
    console.error("Claim action error:", error);
    return NextResponse.json({ error: "Failed to process claim action" }, { status: 500 });
  }
}
