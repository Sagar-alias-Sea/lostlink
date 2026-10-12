import { NextResponse } from "next/server";
import { ensureDatabaseReady } from "@/lib/db-init";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const success = await ensureDatabaseReady();

    if (!success) {
      return NextResponse.json(
        { error: "Failed to initialize database tables." },
        { status: 500 }
      );
    }

    const admin = await prisma.user.findFirst({
      where: { role: "ADMIN" },
      select: { email: true, name: true },
    });

    const foundCount = await prisma.foundItem.count().catch(() => 0);

    return NextResponse.json({
      success: true,
      message: "Database schema provisioned and seeded successfully!",
      admin: admin?.email || "admin@lostlink.org",
      itemsSeeded: foundCount,
    });
  } catch (error: any) {
    console.error("Setup route error:", error);
    return NextResponse.json(
      {
        error: "Database initialization failed",
        details: error?.message || String(error),
      },
      { status: 500 }
    );
  }
}
