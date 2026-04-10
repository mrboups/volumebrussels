import { MetadataRoute } from "next";
import { db } from "@/lib/db";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = "https://volumebrussels.com";

  const staticRoutes = [
    "",
    "/offer",
    "/agenda",
    "/museums",
    "/buy-ticket",
    "/tickets",
    "/news",
    "/terms",
    "/privacy",
  ].map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: "weekly" as const,
    priority: route === "" ? 1.0 : 0.8,
  }));

  // Dynamic routes: articles + events
  try {
    const [articles, events] = await Promise.all([
      db.article.findMany({
        where: { isPublished: true },
        select: { slug: true, updatedAt: true },
      }),
      db.event.findMany({
        where: { isActive: true },
        select: { slug: true, updatedAt: true },
      }),
    ]);

    const articleRoutes = articles.map((a) => ({
      url: `${baseUrl}/news/${a.slug}`,
      lastModified: a.updatedAt,
      changeFrequency: "monthly" as const,
      priority: 0.7,
    }));

    const eventRoutes = events.map((e) => ({
      url: `${baseUrl}/tickets/${e.slug}`,
      lastModified: e.updatedAt,
      changeFrequency: "daily" as const,
      priority: 0.9,
    }));

    return [...staticRoutes, ...articleRoutes, ...eventRoutes];
  } catch {
    return staticRoutes;
  }
}
