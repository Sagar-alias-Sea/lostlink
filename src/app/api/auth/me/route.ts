import { NextRequest, NextResponse } from "next/server";
import { getSessionFromRequest } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const session = await getSessionFromRequest(req);
    if (!session) {
      return NextResponse.json({ user: null }, { status: 200 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        organization: true,
        role: true,
        createdAt: true,
      },
    });

    return NextResponse.json({ user: user || null });
  } catch (error) {
    console.error("Auth me check handled safely:", error);
    return NextResponse.json({ user: null }, { status: 200 });
  }
}
