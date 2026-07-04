import type { MetadataRoute } from "next";
import { brand } from "@/config/brand";

const publicRoutes = [
  "",
  "/pricing",
  "/sample-report",
  "/contact",
  "/pilot",
  "/security",
  "/legal/disclaimer",
];

export default function sitemap(): MetadataRoute.Sitemap {
  return publicRoutes.map((route) => ({
    url: `${brand.url}${route}`,
    lastModified: new Date(),
    changeFrequency: "weekly" as const,
    priority: route === "" ? 1 : 0.7,
  }));
}