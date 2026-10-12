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
    const color = searchParams.get("color");
    const location = searchParams.get("location");
    const sort = searchParams.get("sort") || "recent";
    const userId = searchParams.get("userId");

    const where: any = {};
    if (category && category !== "All") where.category = category;
    if (status && status !== "All") {
      where.status = status;
    }
    if (color && color !== "All") where.color = { contains: color };
    if (location) where.location = { contains: location };
    if (userId) where.userId = userId;

    if (q) {
      where.OR = [
        { itemName: { contains: q } },
        { description: { contains: q } },
        { brand: { contains: q } },
        { model: { contains: q } },
        { location: { contains: q } },
        { reportId: { contains: q } },
      ];
    }

    const orderBy: any = {};
    if (sort === "oldest") {
      orderBy.createdAt = "asc";
    } else {
      orderBy.createdAt = "desc";
    }

    const items = await prisma.foundItem.findMany({
      where,
      orderBy,
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
      },
    });

    return NextResponse.json({ items });
  } catch (error) {
    console.error("Fetch found items error:", error);
    return NextResponse.json({ error: "Failed to fetch found items" }, { status: 500 });
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
      foundDate,
      foundTime,
      location,
      additionalDetails,
      imageUrl,
    } = body;

    if (!itemName || !category || !description || !foundDate || !location) {
      return NextResponse.json(
        { error: "Item name, category, description, date found, and location are required." },
        { status: 400 }
      );
    }

    let reportId = generateReportId("FND");
    let existingId = await prisma.foundItem.findUnique({ where: { reportId } });
    while (existingId) {
      reportId = generateReportId("FND");
      existingId = await prisma.foundItem.findUnique({ where: { reportId } });
    }

    const foundItem = await prisma.foundItem.create({
      data: {
        reportId,
        userId: session.userId,
        itemName: itemName.trim(),
        category,
        brand: brand ? brand.trim() : null,
        model: model ? model.trim() : null,
        color: color ? color.trim() : null,
        description: description.trim(),
        foundDate,
        foundTime: foundTime || null,
        location: location.trim(),
        additionalDetails: additionalDetails ? additionalDetails.trim() : null,
        imageUrl: imageUrl || null,
        status: "REPORTED",
      },
    });

    // Scan existing searching lost items for heuristic matches
    const activeLostItems = await prisma.lostItem.findMany({
      where: {
        status: { in: ["SEARCHING", "POSSIBLE_MATCH"] },
      },
    });

    let matchedCount = 0;
    for (const lost of activeLostItems) {
      const matchResult = calculateMatchScore(
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
          id: foundItem.id,
          itemName: foundItem.itemName,
          category: foundItem.category,
          brand: foundItem.brand,
          model: foundItem.model,
          color: foundItem.color,
          description: foundItem.description,
          location: foundItem.location,
          date: foundItem.foundDate,
        }
      );

      if (matchResult.score >= 50) {
        matchedCount++;
        // Update lost item to POSSIBLE_MATCH
        await prisma.lostItem.update({
          where: { id: lost.id },
          data: { status: "POSSIBLE_MATCH" },
        });

        // Notify the owner of the lost item
        await createNotification({
          userId: lost.userId,
          title: `Possible Match Found (${matchResult.score}% Match)`,
          message: `A found item "${foundItem.itemName}" matching your lost "${lost.itemName}" was reported at ${foundItem.location}. Review and submit a claim if it's yours!`,
          type: "MATCH",
          linkUrl: `/items/${foundItem.id}`,
        });
      }
    }

    if (matchedCount > 0) {
      await prisma.foundItem.update({
        where: { id: foundItem.id },
        data: { status: "POSSIBLE_MATCH" },
      });
    }

    return NextResponse.json({
      item: foundItem,
      matchedCount,
      message: "Found item reported successfully.",
    });
  } catch (error) {
    console.error("Create found item error:", error);
    return NextResponse.json({ error: "Failed to report found item" }, { status: 500 });
  }
}
