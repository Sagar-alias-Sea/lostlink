const { execSync } = require("child_process");

// For schema migrations/push, use direct unpooled connection if available
const directUrl =
  process.env.POSTGRES_URL_NON_POOLING ||
  process.env.DATABASE_URL_UNPOOLED ||
  process.env.POSTGRES_URL ||
  process.env.DATABASE_URL;

// For general database connection
const dbUrl =
  process.env.DATABASE_URL ||
  directUrl ||
  process.env.POSTGRES_PRISMA_URL ||
  process.env.STORAGE_URL;

if (dbUrl) {
  process.env.DATABASE_URL = dbUrl;
  console.log("==> Database connection variable mapped successfully.");
} else {
  console.log("==> No database connection variable detected in environment.");
}

function run(cmd, customEnv = process.env) {
  console.log(`==> Running: ${cmd}`);
  execSync(cmd, { stdio: "inherit", env: customEnv });
}

try {
  // Step 1: Generate Prisma client
  run("npx prisma generate");

  // Step 2: Push database schema if database URL is available
  const pushUrl = directUrl || dbUrl;
  if (pushUrl && !pushUrl.startsWith("file:")) {
    console.log("==> Deploying database schema to PostgreSQL...");
    try {
      run("npx prisma db push --accept-data-loss", {
        ...process.env,
        DATABASE_URL: pushUrl,
      });
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
