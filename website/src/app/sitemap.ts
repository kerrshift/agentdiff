import type { MetadataRoute } from "next";

export const dynamic = "force-static";
import { getDocMetas } from "../lib/docs";
import { getPostMetas } from "../lib/blog";

const SITE_URL = "https://agentdiff.lostmartian.in";

/**
 * Static-export sitemap: the landing page, every docs guide, the blog index,
 * and each blog post as its own indexable entry.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();

  const docEntries: MetadataRoute.Sitemap = getDocMetas().map((doc) => ({
    url: `${SITE_URL}/docs/${doc.slug}`,
    lastModified,
    changeFrequency: "weekly",
    priority: doc.slug === "introduction" ? 0.8 : 0.6,
  }));

  const postEntries: MetadataRoute.Sitemap = getPostMetas().map((post) => ({
    url: `${SITE_URL}/blog/${post.slug}`,
    lastModified: post.date ? new Date(`${post.date}T00:00:00Z`) : lastModified,
    changeFrequency: "monthly",
    priority: 0.7,
  }));

  return [
    {
      url: SITE_URL,
      lastModified,
      changeFrequency: "weekly",
      priority: 1.0,
    },
    {
      url: `${SITE_URL}/docs`,
      lastModified,
      changeFrequency: "weekly",
      priority: 0.9,
    },
    {
      url: `${SITE_URL}/blog`,
      lastModified,
      changeFrequency: "weekly",
      priority: 0.8,
    },
    ...docEntries,
    ...postEntries,
  ];
}
