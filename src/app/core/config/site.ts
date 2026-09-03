export const siteConfig = {
  name: "Cherry",
  description: "Sigue tu ciclo con calma, en cualquier dispositivo.",
  url: process.env.NEXT_PUBLIC_APP_URL ?? "https://cherry-five-beta.vercel.app",
  ogImage: "/og.png",
  backgroundColor: "#f6f2f4",
  /** Top of the app after the pink wash; used for PWA/status chrome. */
  themeColor: "#f0e4e8",
} as const;

export type SiteConfig = typeof siteConfig;
