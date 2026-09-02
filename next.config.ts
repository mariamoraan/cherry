import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: [
    "@prisma/client",
    "./src/app/core/lib/generated/prisma",
    "pg",
  ],
};

export default nextConfig;