import "dotenv/config";

import bcrypt from "bcryptjs";

import { db } from "@/core/lib/db";

async function main() {
  const passwordHash = await bcrypt.hash("Password123!", 12);

  await db.user.upsert({
    where: { email: "test@example.com" },
    update: { passwordHash, name: "Admin" },
    create: {
      email: "test@example.com",
      name: "Admin",
      passwordHash,
    },
  });

  console.log("✅ Seed completado");
}

main()
  .catch(console.error)
  .finally(() => db.$disconnect());
