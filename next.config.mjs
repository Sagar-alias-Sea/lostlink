if (!process.env.DATABASE_URL) {
  process.env.DATABASE_URL =
    process.env.DATABASE_POSTGRES_URL ||
    process.env.DATABASE_POSTGRES_URL_NON_POOLING ||
    process.env.DATABASE_POSTGRES_URL_NO_SSL ||
    process.env.POSTGRES_URL ||
    process.env.POSTGRES_PRISMA_URL;
}

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
