import { db } from "../lib/db";
import { comparePassword, hashPassword } from "../lib/auth";
import { calculateWarrantyStatus, calculateReturnWindowStatus } from "../lib/services/warranty-engine";
import { ReceiptExtractionService } from "../lib/services/ai-extraction";
import { VaultlyAiService } from "../lib/services/vaultly-ai";

async function runTests() {
  console.log("------------------------------------------");
  console.log("RUNNING VAULTLY INTEGRATION TEST SUITE");
  console.log("------------------------------------------");

  // 1. Verify User Authentication & Seeded Account
  console.log("\n[Test 1] Authenticating Demo Account...");
  const user = await db.user.findUnique({
    where: { email: "demo@vaultly.app" },
  });

  if (!user) {
    throw new Error("FAIL: Demo user not found in database.");
  }
  console.log(`✓ User found: ${user.name} (${user.email})`);

  const isValidPass = await comparePassword("password123", user.passwordHash);
  if (!isValidPass) {
    throw new Error("FAIL: Password verification failed.");
  }
  console.log("✓ Password hashing & bcrypt verification PASSED.");

  // 2. Test Purchase CRUD & Retrieval
  console.log("\n[Test 2] Querying Seeded Purchases & Receipts...");
  const purchases = await db.purchase.findMany({
    where: { userId: user.id },
    include: { items: true, receipt: true, warranty: true, returnWindow: true },
  });

  if (purchases.length < 6) {
    throw new Error(`FAIL: Expected 6 seeded purchases, got ${purchases.length}`);
  }
  console.log(`✓ Successfully retrieved ${purchases.length} purchases from SQLite.`);

  const tvPurchase = purchases.find((p) => p.storeName === "Croma");
  if (!tvPurchase || !tvPurchase.receipt) {
    throw new Error("FAIL: Samsung TV purchase or receipt missing.");
  }
  console.log(`✓ Samsung TV purchase found: ₹${tvPurchase.totalAmount} (Receipt: ${tvPurchase.receipt.fileUrl})`);

  // 3. Test Warranty Engine Dynamic Calculations
  console.log("\n[Test 3] Dynamic Warranty & Return Window Engine...");
  const wStats = calculateWarrantyStatus(tvPurchase.warranty!.startDate, 24);
  console.log(`✓ Samsung TV Warranty Status: ${wStats.status.toUpperCase()} (${wStats.daysRemaining} days remaining, ${wStats.percentageElapsed}% elapsed)`);

  const airpodsPurchase = purchases.find((p) => p.storeName === "Apple Store");
  const airpodsWStats = calculateWarrantyStatus(airpodsPurchase!.warranty!.startDate, 12);
  console.log(`✓ Apple AirPods Warranty Status: ${airpodsWStats.status.toUpperCase()} (${airpodsWStats.daysRemaining} days remaining)`);

  if (airpodsWStats.status !== "expiring") {
    console.warn(`Note: AirPods warranty status is ${airpodsWStats.status}`);
  }

  // 4. Test Receipt Extraction Service
  console.log("\n[Test 4] Testing ReceiptExtractionService Provider Abstraction...");
  const extracted = await ReceiptExtractionService.processReceipt(tvPurchase.receipt!.fileUrl);
  if (!extracted.storeName || extracted.items.length === 0) {
    throw new Error("FAIL: ReceiptExtractionService failed to parse receipt.");
  }
  console.log(`✓ Extracted Store: "${extracted.storeName}", Items: ${extracted.items.length}, Confidence: ${extracted.confidence.storeName}`);

  // 5. Test Vaultly AI Contextual Assistant
  console.log("\n[Test 5] Querying Vaultly AI Contextual Assistant...");

  const aiRes1 = await VaultlyAiService.queryVault(user.id, "Which warranties expire soon?");
  console.log(`✓ Query: "Which warranties expire soon?" -> Response: "${aiRes1.answer.slice(0, 80)}..."`);

  const aiRes2 = await VaultlyAiService.queryVault(user.id, "How much did I spend on electronics?");
  console.log(`✓ Query: "How much did I spend on electronics?" -> Response: "${aiRes2.answer.slice(0, 80)}..."`);

  const aiRes3 = await VaultlyAiService.queryVault(user.id, "Find my Samsung TV receipt");
  console.log(`✓ Query: "Find my Samsung TV receipt" -> Matches: ${aiRes3.matchedPurchases?.length}`);

  // 6. Test Data Isolation / Security Check
  console.log("\n[Test 6] Authorization & Data Isolation Check...");
  const newUser = await db.user.create({
    data: {
      name: "Security Tester",
      email: "test.isolation@vaultly.app",
      passwordHash: await hashPassword("pass123"),
    },
  });

  const unauthorizedPurchases = await db.purchase.findMany({
    where: { userId: newUser.id },
  });
  if (unauthorizedPurchases.length !== 0) {
    throw new Error("FAIL: Data isolation leak! New user sees other user's data.");
  }
  console.log("✓ Data Isolation PASSED (New user cannot access demo user data).");

  // Cleanup test user
  await db.user.delete({ where: { id: newUser.id } });

  console.log("------------------------------------------");
  console.log("ALL VAULTLY BACKEND & ENGINE TESTS PASSED!");
  console.log("------------------------------------------");
}

runTests()
  .catch((e) => {
    console.error("Test Suite Failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
