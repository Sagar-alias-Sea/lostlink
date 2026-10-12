import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    // Check if admin already exists
    const existingAdmin = await prisma.user.findFirst({
      where: { role: "ADMIN" },
    });

    if (existingAdmin) {
      return NextResponse.json({
        message: "Database already initialized and active!",
        admin: existingAdmin.email,
      });
    }

    // Seed Admin & Users
    const adminPassword = await bcrypt.hash("Admin@12345", 10);
    const userPassword = await bcrypt.hash("User@12345", 10);

    const admin = await prisma.user.create({
      data: {
        name: "Campus Security Admin",
        email: "admin@lostlink.org",
        passwordHash: adminPassword,
        phone: "+1 (555) 019-2831",
        organization: "Apex University & Tech Park",
        role: "ADMIN",
      },
    });

    const alex = await prisma.user.create({
      data: {
        name: "Alex Chen",
        email: "alex.chen@campus.edu",
        passwordHash: userPassword,
        phone: "+1 (555) 321-4567",
        organization: "Department of Computer Science",
        role: "USER",
      },
    });

    const priya = await prisma.user.create({
      data: {
        name: "Priya Sharma",
        email: "priya.sharma@campus.edu",
        passwordHash: userPassword,
        phone: "+1 (555) 789-0123",
        organization: "Apex Central Library Staff",
        role: "USER",
      },
    });

    const david = await prisma.user.create({
      data: {
        name: "David Kim",
        email: "david.kim@campus.edu",
        passwordHash: userPassword,
        phone: "+1 (555) 456-7890",
        organization: "School of Management",
        role: "USER",
      },
    });

    // Seed Sample Found Items
    const foundBuds = await prisma.foundItem.create({
      data: {
        reportId: "LL-FND-2026-0001",
        userId: priya.id,
        itemName: "OnePlus Nord Buds 2 (Matte Black)",
        category: "Electronics",
        brand: "OnePlus",
        model: "Nord Buds 2",
        color: "Black",
        description: "Black charging case containing wireless earbuds found on study desk #14.",
        foundDate: "2026-09-15",
        location: "Central Library, 2nd Floor Reading Hall",
        imageUrl: "https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=800&auto=format&fit=crop&q=60",
        status: "CLAIM_PENDING",
      },
    });

    const foundIdCard = await prisma.foundItem.create({
      data: {
        reportId: "LL-FND-2026-0002",
        userId: priya.id,
        itemName: "Blue College ID Card & Lanyard",
        category: "ID Cards",
        brand: "Apex University",
        model: "Student SmartCard",
        color: "Blue",
        description: "Blue lanyard with University ID card belonging to an Engineering student.",
        foundDate: "2026-09-16",
        location: "Science Block C Cafeteria",
        imageUrl: "https://images.unsplash.com/photo-1618042164219-62c820f10723?w=800&auto=format&fit=crop&q=60",
        status: "REPORTED",
      },
    });

    const foundWallet = await prisma.foundItem.create({
      data: {
        reportId: "LL-FND-2026-0003",
        userId: priya.id,
        itemName: "Black Leather Bi-Fold Wallet",
        category: "Wallets",
        brand: "Fossil",
        model: "Derrick Bifold",
        color: "Black",
        description: "Men's leather wallet found under the bleachers.",
        foundDate: "2026-09-14",
        location: "Sports Complex Bleachers Area",
        imageUrl: "https://images.unsplash.com/photo-1627123424574-724758594e93?w=800&auto=format&fit=crop&q=60",
        status: "REPORTED",
      },
    });

    // Seed Competing Claims (Alex vs David)
    await prisma.claim.create({
      data: {
        foundItemId: foundBuds.id,
        claimantId: alex.id,
        description: "OnePlus Nord Buds 2 in matte black case with dark grey tips.",
        lostLocation: "Central Library 2nd Floor desk #14",
        lostTime: "Tuesday Sept 15, approximately 11:00 AM",
        uniqueMarks: "White hairline scratch on base of charging case.",
        accessories: "Black silicone protective skin.",
        exactModel: "OnePlus Nord Buds 2 (Model E508A)",
        serialNumber: "SN: OP-NB2-2025-8892",
        status: "UNDER_REVIEW",
      },
    });

    await prisma.claim.create({
      data: {
        foundItemId: foundBuds.id,
        claimantId: david.id,
        description: "Black wireless earbuds inside an oval box.",
        lostLocation: "Library or Quadrangle",
        lostTime: "Around Tuesday noon",
        uniqueMarks: "None that I remember.",
        status: "UNDER_REVIEW",
      },
    });

    return NextResponse.json({
      success: true,
      message: "Database initialized and demo dataset seeded successfully!",
    });
  } catch (error: any) {
    console.error("Database setup error:", error);
    return NextResponse.json(
      {
        error: "Database initialization failed",
        details: error?.message || String(error),
      },
      { status: 500 }
    );
  }
}
