import type { MetadataRoute } from "next";
import { brand } from "@/config/brand";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: [
          "/",
          "/pricing",
          "/sample-report",
          "/contact",
          "/pilot",
          "/legal/disclaimer",
        ],
        disallow: [
          "/dashboard",
          "/dashboard/",
          "/dashboard/*",
          "/login",
          "/signup",
          "/auth/*",
          "/reports/*",
        ],
      },
    ],
    sitemap: `${brand.url}/sitemap.xml`,
  };
}