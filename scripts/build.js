const { execSync } = require("child_process");

// Fallback mapping for Vercel Neon integration variables
const dbUrl =
  process.env.DATABASE_URL ||
  process.env.POSTGRES_PRISMA_URL ||
  process.env.POSTGRES_URL ||
  process.env.DATABASE_URL_UNPOOLED ||
  process.env.STORAGE_URL ||
  process.env.STORAGE_PRISMA_URL;

if (dbUrl) {
  process.env.DATABASE_URL = dbUrl;
  console.log("==> Database connection variable detected.");
} else {
  console.log("==> No database connection variable detected in environment.");
}

function run(cmd) {
  console.log(`==> Running: ${cmd}`);
  execSync(cmd, { stdio: "inherit", env: process.env });
}

try {
  // Step 1: Generate Prisma client
  run("npx prisma generate");

  // Step 2: Push database schema if database URL is available
  if (process.env.DATABASE_URL && !process.env.DATABASE_URL.startsWith("file:")) {
    console.log("==> Deploying database schema to PostgreSQL...");
    try {
      run("npx prisma db push --accept-data-loss");
      console.log("==> Database schema synchronized successfully.");
    } catch (dbErr) {
      console.warn("==> Notice: Database push had an issue, continuing build:", dbErr.message);
    }
  }

  // Step 3: Build Next.js
  run("npx next build");
  console.log("==> LostLink build completed successfully!");
} catch (error) {
  console.error("==> Build failed:", error);
  process.exit(1);
}
