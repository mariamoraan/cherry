import type { NextConfig } from "next";
import { withSerwist } from "@serwist/turbopack";

const nextConfig: NextConfig = {
  serverExternalPackages: [
    "@prisma/client",
    "./src/app/core/lib/generated/prisma",
    "pg",
  ],
};

export default withSerwist(nextConfig);
