export const siteConfig = {
  name: "Cherry",
  description: "Sigue tu ciclo con calma, en cualquier dispositivo.",
  url: process.env.NEXT_PUBLIC_APP_URL ?? "https://cherry-five-beta.vercel.app",
  ogImage: "/og.png",
  backgroundColor: "#f6f2f4",
  /** Same solid as app chrome / header; used for PWA/status bar. */
  themeColor: "#f6f2f4",
} as const;

export type SiteConfig = typeof siteConfig;
