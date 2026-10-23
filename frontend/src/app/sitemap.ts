import type { MetadataRoute } from "next";

const ROUTES = [
  "",
  "/about",
  "/academics",
  "/achievements",
  "/admission",
  "/affiliation",
  "/book-list",
  "/contact",
  "/events",
  "/facilities",
  "/gallery",
  "/mandatory-disclosure",
  "/notices",
];

export default function sitemap(): MetadataRoute.Sitemap {
  const base = "https://www.depaulschoolaska.in";
  const now = new Date();
  return ROUTES.map((route) => ({
    url: `${base}${route}`,
    lastModified: now,
    changeFrequency: route === "" || route === "/notices" ? "weekly" : "monthly",
    priority: route === "" ? 1 : 0.7,
  }));
}
