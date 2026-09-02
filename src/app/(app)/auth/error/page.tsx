import Link from "next/link";

import { siteConfig } from "@/core/config/site";

import styles from "./page.module.scss";

const ERROR_MESSAGES: Record<string, string> = {
  AccessDenied:
    "Your email is not authorized to access this application. If you believe this is a mistake, contact an administrator.",
  Configuration: "There is a problem with the server configuration.",
  Default: "An error occurred during sign in.",
};

type AuthErrorPageProps = {
  searchParams: Promise<{ error?: string }>;
};

export default async function AuthErrorPage({ searchParams }: AuthErrorPageProps) {
  const { error } = await searchParams;
  const message = error
    ? (ERROR_MESSAGES[error] ?? ERROR_MESSAGES.Default)
    : ERROR_MESSAGES.Default;

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <div className={styles.card}>
          <div className={styles.iconWrapper}>
            <svg
              aria-hidden="true"
              className={styles.icon}
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>

          <h1 className={styles.title}>Sign in failed</h1>
          <p className={styles.message}>{message}</p>

          <Link href="/login" className={styles.link}>
            Back to sign in
          </Link>

          <p className={styles.footer}>{siteConfig.name}</p>
        </div>
      </div>
    </div>
  );
}
