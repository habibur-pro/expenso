import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const siteOrigin = new URL(
    process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
  ).origin;

  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/api/", "/dashboard", "/expenses", "/analytics"],
    },
    sitemap: `${siteOrigin}/sitemap.xml`,
  };
}
