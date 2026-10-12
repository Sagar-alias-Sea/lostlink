import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSessionFromRequest } from "@/lib/auth";
import { generateReportId, createNotification } from "@/lib/utils";
import { calculateMatchScore } from "@/lib/matching";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const q = searchParams.get("q");
    const category = searchParams.get("category");
    const status = searchParams.get("status");
    const userId = searchParams.get("userId");

    const where: any = {};
    if (category && category !== "All") where.category = category;
    if (status && status !== "All") where.status = status;
    if (userId) where.userId = userId;

    if (q) {
      where.OR = [
        { itemName: { contains: q } },
        { description: { contains: q } },
        { brand: { contains: q } },
        { location: { contains: q } },
        { reportId: { contains: q } },
      ];
    }

    const items = await prisma.lostItem.findMany({
      where,
      orderBy: { createdAt: "desc" },
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

    return NextResponse.json({ items });
  } catch (error) {
    console.error("Fetch lost items error:", error);
    return NextResponse.json({ error: "Failed to fetch lost items" }, { status: 500 });
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
      itemName,
      category,
      brand,
      model,
      color,
      description,
      lostDate,
      lostTime,
      location,
      additionalDetails,
      imageUrl,
    } = body;

    if (!itemName || !category || !description || !lostDate || !location) {
      return NextResponse.json(
        { error: "Item name, category, description, date lost, and location are required." },
        { status: 400 }
      );
    }

    let reportId = generateReportId("LST");
    let existingId = await prisma.lostItem.findUnique({ where: { reportId } });
    while (existingId) {
      reportId = generateReportId("LST");
      existingId = await prisma.lostItem.findUnique({ where: { reportId } });
    }

    const lostItem = await prisma.lostItem.create({
      data: {
        reportId,
        userId: session.userId,
        itemName: itemName.trim(),
        category,
        brand: brand ? brand.trim() : null,
        model: model ? model.trim() : null,
        color: color ? color.trim() : null,
        description: description.trim(),
        lostDate,
        lostTime: lostTime || null,
        location: location.trim(),
        additionalDetails: additionalDetails ? additionalDetails.trim() : null,
        imageUrl: imageUrl || null,
        status: "SEARCHING",
      },
    });

    // Run heuristic match scan against active found items
    const activeFoundItems = await prisma.foundItem.findMany({
      where: {
        status: { in: ["REPORTED", "POSSIBLE_MATCH", "CLAIM_PENDING"] },
      },
    });

    let bestMatchScore = 0;
    let matchedFoundItem: any = null;

    for (const found of activeFoundItems) {
      const matchResult = calculateMatchScore(
        {
          id: lostItem.id,
          itemName: lostItem.itemName,
          category: lostItem.category,
          brand: lostItem.brand,
          model: lostItem.model,
          color: lostItem.color,
          description: lostItem.description,
          location: lostItem.location,
          date: lostItem.lostDate,
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

      if (matchResult.score >= 50 && matchResult.score > bestMatchScore) {
        bestMatchScore = matchResult.score;
        matchedFoundItem = found;
      }
    }

    if (matchedFoundItem && bestMatchScore >= 50) {
      await prisma.lostItem.update({
        where: { id: lostItem.id },
        data: { status: "POSSIBLE_MATCH" },
      });

      await createNotification({
        userId: session.userId,
        title: `Possible Match Found (${bestMatchScore}% Match)`,
        message: `Your lost item "${lostItem.itemName}" may match a found item "${matchedFoundItem.itemName}" at ${matchedFoundItem.location}. Review and submit a claim if it's yours!`,
        type: "MATCH",
        linkUrl: `/items/${matchedFoundItem.id}`,
      });
    }

    return NextResponse.json({
      item: lostItem,
      matchFound: !!matchedFoundItem,
      matchScore: bestMatchScore,
      matchedItemId: matchedFoundItem?.id,
      message: "Lost item reported successfully.",
    });
  } catch (error) {
    console.error("Create lost item error:", error);
    return NextResponse.json({ error: "Failed to report lost item" }, { status: 500 });
  }
}
