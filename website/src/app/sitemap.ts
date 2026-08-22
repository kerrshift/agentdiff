import type { MetadataRoute } from "next";

export const dynamic = "force-static";
import { getDocMetas } from "../lib/docs";

const SITE_URL = "https://agentdiff.lostmartian.in";

/**
 * Static-export sitemap: the landing page plus every docs guide as its own
 * indexable entry.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();

  const docEntries: MetadataRoute.Sitemap = getDocMetas().map((doc) => ({
    url: `${SITE_URL}/docs/${doc.slug}`,
    lastModified,
    changeFrequency: "weekly",
    priority: doc.slug === "introduction" ? 0.8 : 0.6,
  }));

  return [
    {
      url: SITE_URL,
      lastModified,
      changeFrequency: "weekly",
      priority: 1.0,
    },
    ...docEntries,
  ];
}
