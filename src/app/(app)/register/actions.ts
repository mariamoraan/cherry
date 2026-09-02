"use server";

import bcrypt from "bcryptjs";
import { AuthError } from "next-auth";
import { redirect } from "next/navigation";

import { signIn } from "@/auth";
import { db } from "@/core/lib/db";

export async function registerWithCredentials(formData: FormData) {
  const email = formData.get("email")?.toString().trim().toLowerCase() ?? "";
  const password = formData.get("password")?.toString() ?? "";
  const confirmPassword = formData.get("confirmPassword")?.toString() ?? "";

  if (!email || !password) {
    redirect("/register?error=MissingFields");
  }

  if (password !== confirmPassword) {
    redirect("/register?error=PasswordMismatch");
  }

  if (password.length < 8) {
    redirect("/register?error=PasswordTooShort");
  }

  const existing = await db.user.findUnique({ where: { email } });
  if (existing) {
    redirect("/register?error=EmailTaken");
  }

  const passwordHash = await bcrypt.hash(password, 12);
  await db.user.create({
    data: { email, passwordHash },
  });

  try {
    await signIn("credentials", {
      email,
      password,
      redirectTo: "/dashboard",
    });
  } catch (error) {
    if (error instanceof AuthError && error.type === "CredentialsSignin") {
      redirect("/register?error=SignInFailed");
    }
    throw error;
  }
}

export async function registerWithGitHub() {
  await signIn("github", { redirectTo: "/dashboard" });
}

export async function registerWithGoogle() {
  await signIn("google", { redirectTo: "/dashboard" });
}
