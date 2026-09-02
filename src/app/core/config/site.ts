export const siteConfig = {
    name: "Mi App",
    description: "Descripción de la app",
    url: process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
    ogImage: "/og.png",
  } as const;
  
  export type SiteConfig = typeof siteConfig;