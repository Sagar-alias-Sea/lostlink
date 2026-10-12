import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("Cleaning existing database...");
  await prisma.recoveryRecord.deleteMany({});
  await prisma.claim.deleteMany({});
  await prisma.notification.deleteMany({});
  await prisma.lostItem.deleteMany({});
  await prisma.foundItem.deleteMany({});
  await prisma.user.deleteMany({});

  console.log("Seeding users...");
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

  console.log("Seeding found items...");
  const foundBuds = await prisma.foundItem.create({
    data: {
      reportId: "LL-FND-2026-0001",
      userId: priya.id,
      itemName: "OnePlus Nord Buds 2 (Matte Black)",
      category: "Electronics",
      brand: "OnePlus",
      model: "Nord Buds 2",
      color: "Black",
      description: "Black OnePlus charging case containing wireless earbuds found on study desk #14 on the second floor.",
      foundDate: "2026-09-15",
      foundTime: "11:30 AM",
      location: "Central Library, 2nd Floor Reading Hall",
      additionalDetails: "Case has a small white protective silicon sleeve and minor scratch on bottom.",
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
      model: "Student SmartCard 2026",
      color: "Blue",
      description: "Blue lanyard with Apex University identity card belonging to an Engineering student.",
      foundDate: "2026-09-16",
      foundTime: "01:15 PM",
      location: "Science Block C Cafeteria",
      additionalDetails: "Handed over to security desk in Block C lobby.",
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
      description: "Men's leather wallet found under the bleachers after the basketball tournament.",
      foundDate: "2026-09-14",
      foundTime: "06:45 PM",
      location: "Sports Complex Bleachers Area",
      additionalDetails: "Contains transit pass and library membership card.",
      imageUrl: "https://images.unsplash.com/photo-1627123424574-724758594e93?w=800&auto=format&fit=crop&q=60",
      status: "REPORTED",
    },
  });

  const foundPowerBank = await prisma.foundItem.create({
    data: {
      reportId: "LL-FND-2026-0004",
      userId: priya.id,
      itemName: "20,000mAh Fast Charging Power Bank",
      category: "Electronics",
      brand: "Mi / Xiaomi",
      model: "Power Bank 3i",
      color: "Black",
      description: "Heavy black power bank with dual USB ports and micro-USB cable attached.",
      foundDate: "2026-09-13",
      foundTime: "04:20 PM",
      location: "Seminar Hall A, Row 4",
      additionalDetails: "Left plugged into wall outlet during annual symposium.",
      imageUrl: "https://images.unsplash.com/photo-1609091839311-d5365f9ff1c5?w=800&auto=format&fit=crop&q=60",
      status: "REPORTED",
    },
  });

  const foundCharger = await prisma.foundItem.create({
    data: {
      reportId: "LL-FND-2026-0005",
      userId: priya.id,
      itemName: "Dell 65W USB-C Laptop Charger",
      category: "Electronics",
      brand: "Dell",
      model: "65W Type-C AC Adapter",
      color: "Black",
      description: "Original Dell oval AC adapter with Type-C power delivery cable.",
      foundDate: "2026-09-15",
      foundTime: "09:00 AM",
      location: "Study Room 304, Tech Tower",
      additionalDetails: "Marked with a tiny yellow dot sticker near the barrel.",
      imageUrl: "https://images.unsplash.com/photo-1583863788434-e58a36330cf0?w=800&auto=format&fit=crop&q=60",
      status: "REPORTED",
    },
  });

  const foundBackpack = await prisma.foundItem.create({
    data: {
      reportId: "LL-FND-2026-0006",
      userId: priya.id,
      itemName: "Black SwissGear Laptop Backpack",
      category: "Bags",
      brand: "SwissGear",
      model: "ScanSmart TSA Backpack",
      color: "Black",
      description: "Sturdy black ballistic nylon backpack found unattended on bench.",
      foundDate: "2026-09-12",
      foundTime: "05:10 PM",
      location: "Campus Transit Terminal Waiting Area",
      additionalDetails: "Contains spiral notebooks and stationary pouch.",
      imageUrl: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=800&auto=format&fit=crop&q=60",
      status: "RECOVERED",
    },
  });

  console.log("Seeding lost items...");
  const lostBuds = await prisma.lostItem.create({
    data: {
      reportId: "LL-LST-2026-0001",
      userId: alex.id,
      itemName: "OnePlus Wireless Earbuds (Nord Buds 2)",
      category: "Electronics",
      brand: "OnePlus",
      model: "Nord Buds 2",
      color: "Black",
      description: "Lost my black OnePlus wireless earbuds in charging case while doing research. Case has a minor scratch on the underside.",
      lostDate: "2026-09-15",
      lostTime: "11:00 AM",
      location: "Central Library, 2nd Floor",
      additionalDetails: "Serial number on box ends with 8892. Left earbud has bass wave EQ preset activated in HeyMelody app.",
      imageUrl: "https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=800&auto=format&fit=crop&q=60",
      status: "CLAIM_PENDING",
    },
  });

  await prisma.lostItem.create({
    data: {
      reportId: "LL-LST-2026-0002",
      userId: alex.id,
      itemName: "Apex Student ID & Transit Pass",
      category: "ID Cards",
      brand: "Apex University",
      model: "ID Card",
      color: "Blue",
      description: "Lost my student ID card on blue ribbon lanyard. Contains my roll number.",
      lostDate: "2026-09-16",
      lostTime: "12:45 PM",
      location: "Science Block C or Cafeteria",
      imageUrl: "https://images.unsplash.com/photo-1618042164219-62c820f10723?w=800&auto=format&fit=crop&q=60",
      status: "POSSIBLE_MATCH",
    },
  });

  await prisma.lostItem.create({
    data: {
      reportId: "LL-LST-2026-0003",
      userId: david.id,
      itemName: "Fossil Men's Leather Wallet",
      category: "Wallets",
      brand: "Fossil",
      model: "Leather Bifold",
      color: "Black",
      description: "Dark black leather wallet slipped out of gym shorts pocket during basketball practice.",
      lostDate: "2026-09-14",
      lostTime: "06:00 PM",
      location: "Sports Complex",
      imageUrl: "https://images.unsplash.com/photo-1627123424574-724758594e93?w=800&auto=format&fit=crop&q=60",
      status: "POSSIBLE_MATCH",
    },
  });

  console.log("Seeding claims (Demonstrating MULTIPLE CLAIMS review case)...");
  // Claim A by Alex Chen (Strong claim with exact specs)
  const claimA = await prisma.claim.create({
    data: {
      foundItemId: foundBuds.id,
      claimantId: alex.id,
      description: "OnePlus Nord Buds 2 in matte black case with dark grey ear tips.",
      lostLocation: "Central Library 2nd Floor desk #14",
      lostTime: "Tuesday Sept 15, approximately 11:00 AM",
      uniqueMarks: "There is a 1cm diagonal white hairline scratch on the base of the charging case near the USB-C port.",
      accessories: "Came with black silicone protective skin and short red Type-C charging wire in pocket.",
      exactModel: "OnePlus Nord Buds 2 (Model E508A)",
      serialNumber: "SN: OP-NB2-2025-8892",
      identifyingInfo: "HeyMelody app on my phone is paired to this device MAC ending in B4:2A.",
      evidenceUrl: "https://images.unsplash.com/photo-1555421689-491a97ff2040?w=800&auto=format&fit=crop&q=60",
      status: "UNDER_REVIEW",
      adminNotes: "Claimant provided matching serial number on invoice and exact desk location.",
    },
  });

  // Claim B by David Kim (Vague competing claim)
  const claimB = await prisma.claim.create({
    data: {
      foundItemId: foundBuds.id,
      claimantId: david.id,
      description: "Black wireless earbuds inside a black oval charging box.",
      lostLocation: "Somewhere in the Library or Main Quadrangle",
      lostTime: "Around Tuesday noon",
      uniqueMarks: "None that I can recall.",
      accessories: "Standard charging box.",
      exactModel: "OnePlus Buds (don't remember exact version)",
      serialNumber: "Not sure",
      identifyingInfo: "I think it had low battery when lost.",
      evidenceUrl: null,
      status: "UNDER_REVIEW",
      adminNotes: "Lacks serial number or specific distinguishing marks.",
    },
  });

  // Recovered item record for the backpack
  const recoveredClaim = await prisma.claim.create({
    data: {
      foundItemId: foundBackpack.id,
      claimantId: alex.id,
      description: "Black SwissGear ScanSmart backpack with CS notebook and water bottle.",
      lostLocation: "Transit terminal bench",
      lostTime: "Sept 12 5:00 PM",
      uniqueMarks: "Has Apex Hackathon 2025 enamel pin on top zipper.",
      accessories: "Grey umbrella in side mesh.",
      exactModel: "ScanSmart 1900",
      serialNumber: "SWISS-1900-BK",
      status: "APPROVED",
      reviewedAt: new Date(),
    },
  });

  await prisma.recoveryRecord.create({
    data: {
      foundItemId: foundBackpack.id,
      claimId: recoveredClaim.id,
      approvedById: admin.id,
      handoverNotes: "Verified student ID and matched hackathon enamel pin. Item safely handed over at security reception.",
    },
  });

  console.log("Seeding notifications...");
  await prisma.notification.create({
    data: {
      userId: alex.id,
      title: "Possible Match Detected (85% Match)",
      message: "Your reported lost item 'OnePlus Wireless Earbuds' closely matches a found item reported at Central Library.",
      type: "MATCH",
      linkUrl: `/items/${foundBuds.id}`,
      isRead: false,
    },
  });

  await prisma.notification.create({
    data: {
      userId: alex.id,
      title: "Claim Under Review",
      message: "Your ownership claim for 'OnePlus Nord Buds 2' has been logged and is under administrator verification.",
      type: "CLAIM_STATUS",
      linkUrl: "/my-reports",
      isRead: true,
    },
  });

  await prisma.notification.create({
    data: {
      userId: alex.id,
      title: "Item Recovered",
      message: "Your reported lost 'Black SwissGear Laptop Backpack' has been officially verified and marked as recovered!",
      type: "RECOVERY",
      linkUrl: "/my-reports",
      isRead: true,
    },
  });

  await prisma.notification.create({
    data: {
      userId: david.id,
      title: "Claim Under Review",
      message: "Your ownership claim for 'OnePlus Nord Buds 2' has been logged and is queued for verification.",
      type: "CLAIM_STATUS",
      linkUrl: "/my-reports",
      isRead: false,
    },
  });

  console.log("Database seeded successfully!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
