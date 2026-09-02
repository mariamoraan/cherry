import bcrypt from "bcryptjs";

import { isAllowedEmail } from "@/core/config/allowed-emails";
import { db } from "@/core/lib/db";

export async function verifyCredentials(
  email: string,
  password: string,
): Promise<{ id: string; email: string; name: string | null } | null> {
  const normalizedEmail = email.trim().toLowerCase();

  if (!normalizedEmail || !password || !isAllowedEmail(normalizedEmail)) {
    return null;
  }

  const user = await db.user.findUnique({
    where: { email: normalizedEmail },
    select: {
      id: true,
      email: true,
      name: true,
      passwordHash: true,
    },
  });

  if (!user?.passwordHash) {
    return null;
  }

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    return null;
  }

  return { id: user.id, email: user.email, name: user.name };
}
