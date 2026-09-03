export const siteConfig = {
  name: "Cherry",
  description: "Sigue tu ciclo con calma, en cualquier dispositivo.",
  url: process.env.NEXT_PUBLIC_APP_URL ?? "https://cherry-five-beta.vercel.app",
  ogImage: "/og.png",
  backgroundColor: "#f1e6e2",
  /** Same solid as app chrome / header; used for PWA/status bar. */
  themeColor: "#f1e6e2",
} as const;

export type SiteConfig = typeof siteConfig;
