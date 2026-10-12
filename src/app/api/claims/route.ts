import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSessionFromRequest } from "@/lib/auth";
import { createNotification } from "@/lib/utils";

export async function GET(req: NextRequest) {
  try {
    const session = await getSessionFromRequest(req);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized. Please log in." }, { status: 401 });
    }

    const claims = await prisma.claim.findMany({
      where: { claimantId: session.userId },
      orderBy: { createdAt: "desc" },
      include: {
        foundItem: {
          select: {
            id: true,
            reportId: true,
            itemName: true,
            category: true,
            location: true,
            foundDate: true,
            imageUrl: true,
            status: true,
          },
        },
      },
    });

    return NextResponse.json({ claims });
  } catch (error) {
    console.error("Fetch user claims error:", error);
    return NextResponse.json({ error: "Failed to fetch claims" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSessionFromRequest(req);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized. Please log in." }, { status: 401 });
    }

    const body = await req.json();
    const {
      foundItemId,
      description,
      lostLocation,
      lostTime,
      uniqueMarks,
      accessories,
      exactModel,
      serialNumber,
      identifyingInfo,
      evidenceUrl,
    } = body;

    if (!foundItemId || !description || !lostLocation || !lostTime) {
      return NextResponse.json(
        { error: "Please answer all required ownership verification questions." },
        { status: 400 }
      );
    }

    // Check item existence
    const foundItem = await prisma.foundItem.findUnique({
      where: { id: foundItemId },
      include: {
        claims: true,
      },
    });

    if (!foundItem) {
      return NextResponse.json({ error: "Item not found" }, { status: 404 });
    }

    if (foundItem.status === "RECOVERED" || foundItem.status === "CLOSED") {
      return NextResponse.json(
        { error: "This item has already been recovered or closed." },
        { status: 400 }
      );
    }

    if (foundItem.userId === session.userId) {
      return NextResponse.json(
        { error: "You cannot claim an item that you reported as found." },
        { status: 400 }
      );
    }

    // Check duplicate claim
    const existingClaim = await prisma.claim.findFirst({
      where: {
        foundItemId,
        claimantId: session.userId,
      },
    });

    if (existingClaim) {
      return NextResponse.json(
        { error: "You have already submitted an ownership claim for this item." },
        { status: 409 }
      );
    }

    // Create claim
    const claim = await prisma.claim.create({
      data: {
        foundItemId,
        claimantId: session.userId,
        description: description.trim(),
        lostLocation: lostLocation.trim(),
        lostTime: lostTime.trim(),
        uniqueMarks: uniqueMarks ? uniqueMarks.trim() : null,
        accessories: accessories ? accessories.trim() : null,
        exactModel: exactModel ? exactModel.trim() : null,
        serialNumber: serialNumber ? serialNumber.trim() : null,
        identifyingInfo: identifyingInfo ? identifyingInfo.trim() : null,
        evidenceUrl: evidenceUrl || null,
        status: "SUBMITTED",
      },
    });

    // Update found item status: now has claims
    await prisma.foundItem.update({
      where: { id: foundItemId },
      data: { status: "CLAIM_PENDING" },
    });

    // Notify user
    await createNotification({
      userId: session.userId,
      title: "Claim Submitted Successfully",
      message: `Your ownership claim for "${foundItem.itemName}" has been submitted for administrator review. We will notify you once verified.`,
      type: "CLAIM_STATUS",
      linkUrl: "/my-reports",
    });

    return NextResponse.json({
      claim,
      totalClaimsOnItem: foundItem.claims.length + 1,
      message: "Ownership claim submitted successfully.",
    });
  } catch (error) {
    console.error("Submit claim error:", error);
    return NextResponse.json({ error: "Failed to submit claim" }, { status: 500 });
  }
}
