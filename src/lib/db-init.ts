import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";

let isInitialized = false;

const DDL_STATEMENTS = [
  `CREATE TABLE IF NOT EXISTS "User" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "organization" TEXT,
    "passwordHash" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'USER',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
  );`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "User_email_key" ON "User"("email");`,

  `CREATE TABLE IF NOT EXISTS "LostItem" (
    "id" TEXT NOT NULL,
    "reportId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "itemName" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "brand" TEXT,
    "model" TEXT,
    "color" TEXT,
    "description" TEXT NOT NULL,
    "lostDate" TEXT NOT NULL,
    "lostTime" TEXT,
    "location" TEXT NOT NULL,
    "additionalDetails" TEXT,
    "imageUrl" TEXT,
    "status" TEXT NOT NULL DEFAULT 'SEARCHING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "LostItem_pkey" PRIMARY KEY ("id")
  );`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "LostItem_reportId_key" ON "LostItem"("reportId");`,
  `CREATE INDEX IF NOT EXISTS "LostItem_category_idx" ON "LostItem"("category");`,
  `CREATE INDEX IF NOT EXISTS "LostItem_status_idx" ON "LostItem"("status");`,

  `CREATE TABLE IF NOT EXISTS "FoundItem" (
    "id" TEXT NOT NULL,
    "reportId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "itemName" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "brand" TEXT,
    "model" TEXT,
    "color" TEXT,
    "description" TEXT NOT NULL,
    "foundDate" TEXT NOT NULL,
    "foundTime" TEXT,
    "location" TEXT NOT NULL,
    "additionalDetails" TEXT,
    "imageUrl" TEXT,
    "status" TEXT NOT NULL DEFAULT 'REPORTED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "FoundItem_pkey" PRIMARY KEY ("id")
  );`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "FoundItem_reportId_key" ON "FoundItem"("reportId");`,
  `CREATE INDEX IF NOT EXISTS "FoundItem_category_idx" ON "FoundItem"("category");`,
  `CREATE INDEX IF NOT EXISTS "FoundItem_status_idx" ON "FoundItem"("status");`,

  `CREATE TABLE IF NOT EXISTS "Claim" (
    "id" TEXT NOT NULL,
    "foundItemId" TEXT NOT NULL,
    "claimantId" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "lostLocation" TEXT NOT NULL,
    "lostTime" TEXT NOT NULL,
    "uniqueMarks" TEXT,
    "accessories" TEXT,
    "exactModel" TEXT,
    "serialNumber" TEXT,
    "identifyingInfo" TEXT,
    "evidenceUrl" TEXT,
    "status" TEXT NOT NULL DEFAULT 'SUBMITTED',
    "adminNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reviewedAt" TIMESTAMP(3),
    CONSTRAINT "Claim_pkey" PRIMARY KEY ("id")
  );`,
  `CREATE INDEX IF NOT EXISTS "Claim_foundItemId_idx" ON "Claim"("foundItemId");`,
  `CREATE INDEX IF NOT EXISTS "Claim_claimantId_idx" ON "Claim"("claimantId");`,
  `CREATE INDEX IF NOT EXISTS "Claim_status_idx" ON "Claim"("status");`,

  `CREATE TABLE IF NOT EXISTS "Notification" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "linkUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
  );`,
  `CREATE INDEX IF NOT EXISTS "Notification_userId_idx" ON "Notification"("userId");`,
  `CREATE INDEX IF NOT EXISTS "Notification_isRead_idx" ON "Notification"("isRead");`,

  `CREATE TABLE IF NOT EXISTS "RecoveryRecord" (
    "id" TEXT NOT NULL,
    "foundItemId" TEXT NOT NULL,
    "claimId" TEXT NOT NULL,
    "approvedById" TEXT NOT NULL,
    "recoveredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "handoverNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "RecoveryRecord_pkey" PRIMARY KEY ("id")
  );`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "RecoveryRecord_foundItemId_key" ON "RecoveryRecord"("foundItemId");`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "RecoveryRecord_claimId_key" ON "RecoveryRecord"("claimId");`,
];

export async function ensureDatabaseReady() {
  if (isInitialized) return true;

  try {
    // 1. Create tables if they do not exist
    for (const sql of DDL_STATEMENTS) {
      await prisma.$executeRawUnsafe(sql).catch((err) => {
        // Table or index already exists or dialect variance
      });
    }

    // 2. Check if admin exists
    const adminExists = await prisma.user.findFirst({
      where: { role: "ADMIN" },
    }).catch(() => null);

    if (!adminExists) {
      await seedDefaultData();
    }

    isInitialized = true;
    return true;
  } catch (error) {
    console.warn("Auto-initialization notice:", error);
    return false;
  }
}

export async function seedDefaultData() {
  try {
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

    // Sample Found Items
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

    // Seed Competing Claims
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

    return true;
  } catch (seedErr) {
    console.warn("Seeding notice:", seedErr);
    return false;
  }
}
