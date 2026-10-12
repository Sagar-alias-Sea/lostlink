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
    const type = searchParams.get("type") || "ALL"; // LOST | FOUND | ALL
    const q = searchParams.get("q");

    let lostItems: any[] = [];
    let foundItems: any[] = [];

    const searchFilter = q
      ? {
          OR: [
            { itemName: { contains: q } },
            { description: { contains: q } },
            { location: { contains: q } },
            { reportId: { contains: q } },
          ],
        }
      : {};

    if (type === "ALL" || type === "LOST") {
      lostItems = await prisma.lostItem.findMany({
        where: searchFilter,
        orderBy: { createdAt: "desc" },
        include: {
          user: {
            select: { id: true, name: true, email: true, phone: true, organization: true },
          },
        },
      });
    }

    if (type === "ALL" || type === "FOUND") {
      foundItems = await prisma.foundItem.findMany({
        where: searchFilter,
        orderBy: { createdAt: "desc" },
        include: {
          user: {
            select: { id: true, name: true, email: true, phone: true, organization: true },
          },
          _count: {
            select: { claims: true },
          },
        },
      });
    }

    return NextResponse.json({
      lostItems: lostItems.map((item) => ({ ...item, reportType: "LOST" })),
      foundItems: foundItems.map((item) => ({ ...item, reportType: "FOUND" })),
    });
  } catch (error) {
    console.error("Admin reports error:", error);
    return NextResponse.json({ error: "Failed to fetch reports" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const session = await getSessionFromRequest(req);
    if (!session || session.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const body = await req.json();
    const { id, type, status } = body;

    if (!id || !type || !status) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    if (type === "LOST") {
      const updated = await prisma.lostItem.update({
        where: { id },
        data: { status },
      });
      return NextResponse.json({ item: updated });
    } else {
      const updated = await prisma.foundItem.update({
        where: { id },
        data: { status },
      });
      return NextResponse.json({ item: updated });
    }
  } catch (error) {
    console.error("Update report error:", error);
    return NextResponse.json({ error: "Failed to update report status" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await getSessionFromRequest(req);
    if (!session || session.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    const type = searchParams.get("type");

    if (!id || !type) {
      return NextResponse.json({ error: "Item ID and type required" }, { status: 400 });
    }

    if (type === "LOST") {
      await prisma.lostItem.delete({ where: { id } });
    } else {
      await prisma.foundItem.delete({ where: { id } });
    }

    return NextResponse.json({ success: true, message: "Report deleted successfully" });
  } catch (error) {
    console.error("Delete report error:", error);
    return NextResponse.json({ error: "Failed to delete report" }, { status: 500 });
  }
}
