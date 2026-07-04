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
          "/security",
          "/legal/disclaimer",
        ],
        disallow: [
          "/auth/*",
          "/login",
          "/signup",
          "/onboarding",
          "/dashboard/*",
          "/app/*",
          "/reports/*",
          "/health",
          "/production-qa",
          "/launch-package",
          "/paid-pilot-checklist",
          "/launch-checklist",
          "/outreach",
          "/demo-script",
          "/pitch",
        ],
      },
    ],
    sitemap: `${brand.url}/sitemap.xml`,
    host: brand.url,
  };
}