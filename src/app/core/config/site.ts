export const siteConfig = {
  name: "Cherry",
  description: "Sigue tu ciclo con calma, en cualquier dispositivo.",
  url: process.env.NEXT_PUBLIC_APP_URL ?? "https://cherry-five-beta.vercel.app",
  ogImage: "/og.png",
} as const;

export type SiteConfig = typeof siteConfig;
