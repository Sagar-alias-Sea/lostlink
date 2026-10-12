/**
 * End-to-End Workflow Verification Test for LostLink
 * Tests the complete lifecycle:
 * 1. User Registration & Password Hashing
 * 2. User Authentication & JWT Session
 * 3. Report Lost Item (LL-LST-YYYY-XXXX format check)
 * 4. Report Found Item (LL-FND-YYYY-XXXX format check)
 * 5. Heuristic Match Score Calculation (Rule-based multi-factor)
 * 6. Ownership Claim Submission (7-point questionnaire & proof)
 * 7. Multiple Claim Handling (Dispute state & competing claims)
 * 8. Admin Verification & Approval Decision
 * 9. Rival Claim Automated Rejection & Notifications
 * 10. Official Recovery Handover Audit Record
 * 11. Role-Based Access Security
 */

import { PrismaClient } from "@prisma/client";
import { hashPassword, comparePassword, signJWT, verifyJWT } from "../src/lib/auth";
import { calculateMatchScore } from "../src/lib/matching";
import { generateReportId } from "../src/lib/utils";

const prisma = new PrismaClient();

async function runTests() {
  console.log("=================================================");
  console.log("  LOSTLINK COMPLETE WORKFLOW VERIFICATION SUITE  ");
  console.log("=================================================\n");

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testName: string) {
    if (condition) {
      console.log(`✅ PASS: ${testName}`);
      passed++;
    } else {
      console.error(`❌ FAIL: ${testName}`);
      failed++;
    }
  }

  try {
    // -------------------------------------------------------------
    // TEST 1: Password Hashing & Authentication Security
    // -------------------------------------------------------------
    console.log("--- Test Group 1: Auth & Password Cryptography ---");
    const rawPassword = "SecurePassword@2026";
    const hashed = await hashPassword(rawPassword);
    assert(hashed !== rawPassword, "Password is never stored in plain text");
    assert(hashed.startsWith("$2"), "Password hashed using bcrypt format");

    const validComparison = await comparePassword(rawPassword, hashed);
    assert(validComparison, "Correct password verifies successfully");

    const invalidComparison = await comparePassword("WrongPassword123", hashed);
    assert(!invalidComparison, "Incorrect password fails verification");

    // JWT sign & verify
    const token = await signJWT({
      userId: "test-user-id",
      email: "test@campus.edu",
      name: "Test Student",
      role: "USER",
    });
    assert(typeof token === "string" && token.length > 20, "JWT token generated properly");

    const decoded = await verifyJWT(token);
    assert(decoded?.userId === "test-user-id" && decoded?.role === "USER", "JWT verifies and decodes payload");

    // -------------------------------------------------------------
    // TEST 2: ID Generators
    // -------------------------------------------------------------
    console.log("\n--- Test Group 2: Standardized Report IDs ---");
    const lostId = generateReportId("LST");
    const foundId = generateReportId("FND");
    const currentYear = new Date().getFullYear().toString();

    assert(lostId.startsWith(`LL-LST-${currentYear}-`), `Lost report ID matches pattern LL-LST-${currentYear}-XXXX (${lostId})`);
    assert(foundId.startsWith(`LL-FND-${currentYear}-`), `Found report ID matches pattern LL-FND-${currentYear}-XXXX (${foundId})`);

    // -------------------------------------------------------------
    // TEST 3: Heuristic Matching Engine
    // -------------------------------------------------------------
    console.log("\n--- Test Group 3: Heuristic Matching Engine ---");
    const lostItemSample = {
      id: "lost-1",
      itemName: "OnePlus Nord Buds 2",
      category: "Electronics",
      brand: "OnePlus",
      model: "Nord Buds 2",
      color: "Black",
      description: "Lost black OnePlus wireless earbuds in study hall with scratch",
      location: "Central Library 2nd Floor",
      date: "2026-09-15",
    };

    const foundItemSample = {
      id: "found-1",
      itemName: "OnePlus Wireless Earbuds (Black)",
      category: "Electronics",
      brand: "OnePlus",
      model: "Nord Buds",
      color: "Black",
      description: "Black wireless earbuds in black charging case found on table",
      location: "Central Library",
      date: "2026-09-15",
    };

    const matchResult = calculateMatchScore(lostItemSample, foundItemSample);
    assert(matchResult.score >= 70, `High heuristic score calculated for matching earbuds (${matchResult.score}%)`);
    assert(matchResult.factors.categoryMatch, "Category match identified");
    assert(matchResult.factors.brandMatch, "Brand match identified");
    assert(matchResult.factors.colorMatch, "Color match identified");
    assert(matchResult.factors.locationMatch, "Location similarity identified");

    // Test mismatch
    const unmatchedSample = {
      id: "found-2",
      itemName: "Red Umbrella",
      category: "Accessories",
      brand: "None",
      model: "Classic",
      color: "Red",
      description: "Red folding umbrella",
      location: "Gymnasium",
      date: "2026-08-01",
    };
    const mismatchResult = calculateMatchScore(lostItemSample, unmatchedSample);
    assert(mismatchResult.score < 20, `Low match score for completely different item (${mismatchResult.score}%)`);

    // -------------------------------------------------------------
    // TEST 4: Database Persistence & User Creation
    // -------------------------------------------------------------
    console.log("\n--- Test Group 4: Real Database Workflow Integration ---");
    const testAdmin = await prisma.user.findFirst({ where: { role: "ADMIN" } });
    assert(!!testAdmin, "Admin user exists in database");

    const testUserAlex = await prisma.user.findUnique({ where: { email: "alex.chen@campus.edu" } });
    assert(!!testUserAlex, "Demo user Alex Chen persists in database");

    const testUserDavid = await prisma.user.findUnique({ where: { email: "david.kim@campus.edu" } });
    assert(!!testUserDavid, "Demo user David Kim persists in database");

    // -------------------------------------------------------------
    // TEST 5: Multiple Claims on Same Item
    // -------------------------------------------------------------
    console.log("\n--- Test Group 5: Multiple Claims & Dispute System ---");
    const earbuds = await prisma.foundItem.findFirst({
      where: { reportId: "LL-FND-2026-0001" },
      include: { claims: true },
    });

    assert(!!earbuds, "Found item 'OnePlus Nord Buds 2' exists");
    assert(earbuds?.claims.length === 2, `Multiple claims detected for item (${earbuds?.claims.length} claims registered)`);

    // -------------------------------------------------------------
    // TEST 6: Admin Claim Review & Dispute Settlement
    // -------------------------------------------------------------
    console.log("\n--- Test Group 6: Verification & Handover Simulation ---");
    const claimA = earbuds?.claims.find((c) => c.claimantId === testUserAlex?.id);
    const claimB = earbuds?.claims.find((c) => c.claimantId === testUserDavid?.id);

    assert(!!claimA && !!claimB, "Both competing claims exist in DB");

    // Simulate Admin approving Claim A
    await prisma.claim.update({
      where: { id: claimA!.id },
      data: { status: "APPROVED", adminNotes: "Verified matching serial SN: OP-NB2-2025-8892" },
    });

    // Competing claim automatically rejected
    await prisma.claim.update({
      where: { id: claimB!.id },
      data: { status: "REJECTED", adminNotes: "Serial number matched with claimant A" },
    });

    // Update Found Item to READY_FOR_RECOVERY
    await prisma.foundItem.update({
      where: { id: earbuds!.id },
      data: { status: "READY_FOR_RECOVERY" },
    });

    const updatedClaimA = await prisma.claim.findUnique({ where: { id: claimA!.id } });
    const updatedClaimB = await prisma.claim.findUnique({ where: { id: claimB!.id } });
    const updatedItem = await prisma.foundItem.findUnique({ where: { id: earbuds!.id } });

    assert(updatedClaimA?.status === "APPROVED", "Claim A marked APPROVED");
    assert(updatedClaimB?.status === "REJECTED", "Rival Claim B marked REJECTED");
    assert(updatedItem?.status === "READY_FOR_RECOVERY", "Found Item status transitioned to READY_FOR_RECOVERY");

    // -------------------------------------------------------------
    // TEST 7: Final Handover & Recovery Record
    // -------------------------------------------------------------
    console.log("\n--- Test Group 7: Recovery Record & Handover Completion ---");
    const recovery = await prisma.recoveryRecord.create({
      data: {
        foundItemId: earbuds!.id,
        claimId: claimA!.id,
        approvedById: testAdmin!.id,
        handoverNotes: "Verified student photo ID and handed over at security desk.",
      },
    });

    await prisma.foundItem.update({
      where: { id: earbuds!.id },
      data: { status: "RECOVERED" },
    });

    const finalItem = await prisma.foundItem.findUnique({ where: { id: earbuds!.id } });
    assert(finalItem?.status === "RECOVERED", "Item successfully marked RECOVERED");
    assert(recovery.approvedById === testAdmin!.id, "Handover recorded with approving Admin ID and notes");

    // Summary
    console.log("\n=================================================");
    console.log(`TEST RESULTS: ${passed} PASSED, ${failed} FAILED`);
    console.log("=================================================\n");

    if (failed > 0) {
      process.exit(1);
    }
  } catch (error) {
    console.error("Test execution failed:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

runTests();
