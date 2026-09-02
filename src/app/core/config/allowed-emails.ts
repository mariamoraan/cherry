export const ALLOWED_EMAILS = ["test@example.com"] as const;

export type AllowedEmail = (typeof ALLOWED_EMAILS)[number];

export function isAllowedEmail(email: string | null | undefined): email is AllowedEmail {
  if (!email) return false;
  return (ALLOWED_EMAILS as readonly string[]).includes(email.toLowerCase());
}
