import type { MetadataRoute } from "next";
import { brand } from "@/config/brand";

export default function sitemap(): MetadataRoute.Sitemap {
  const routes = [
    "",
    "/pricing",
    "/sample-report",
    "/contact",
    "/pilot",
    "/legal/disclaimer",
    "/pitch",
    "/demo-script",
    "/launch-checklist",
    "/outreach",
    "/security",
    "/production-qa",
  ];

  return routes.map((route) => ({
    url: `${brand.url}${route}`,
    lastModified: new Date(),
    changeFrequency: "weekly",
    priority: route === "" ? 1 : 0.7,
  }));
}