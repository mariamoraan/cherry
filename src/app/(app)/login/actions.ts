"use server";

import { AuthError } from "next-auth";
import { redirect } from "next/navigation";

import { signIn } from "@/auth";

export async function loginWithCredentials(formData: FormData) {
  try {
    await signIn("credentials", {
      email: formData.get("email")?.toString().trim(),
      password: formData.get("password")?.toString(),
      redirectTo: "/dashboard",
    });
  } catch (error) {
    if (error instanceof AuthError && error.type === "CredentialsSignin") {
      redirect("/login?error=CredentialsSignin");
    }
    throw error;
  }
}

export async function loginWithGitHub() {
  await signIn("github", { redirectTo: "/dashboard" });
}

export async function loginWithGoogle() {
  await signIn("google", { redirectTo: "/dashboard" });
}
