export const SITE_IMAGE_SLOTS = [
  {
    key: "schoolLogo",
    label: "School logo",
    description: "Header, footer, and school identity card.",
    defaultPath: "/images/school-logo.png",
  },
  {
    key: "homeHero",
    label: "Homepage hero",
    description: "Large background image at the top of the homepage.",
    defaultPath: "/images/school-campus.png",
  },
  {
    key: "homeCampus",
    label: "Homepage campus feature",
    description: "Campus photo in the homepage About section.",
    defaultPath: "/images/campus.jpg",
  },
  {
    key: "chairman",
    label: "Chairman portrait",
    description: "Chairman message photo.",
    defaultPath: "/images/chairman.jpg",
  },
  {
    key: "principal",
    label: "Principal portrait",
    description: "Principal message and public staff profile photo.",
    defaultPath: "/images/principal.jpg",
  },
  {
    key: "aboutCampus",
    label: "About page campus photo",
    description: "First campus image on the About page.",
    defaultPath: "/images/campus2.jpg",
  },
  {
    key: "aboutLibrary",
    label: "About page library photo",
    description: "Second image on the About page.",
    defaultPath: "/images/campus1.jpg",
  },
  {
    key: "scienceLab",
    label: "Science laboratory",
    description: "Academics and Facilities pages.",
    defaultPath: "/images/science-lab.jpg",
  },
  {
    key: "library",
    label: "Library",
    description: "Facilities page library card.",
    defaultPath: "/images/library.jpg",
  },
  {
    key: "sports",
    label: "Sports",
    description: "Facilities and Achievements pages.",
    defaultPath: "/images/sports.jpg",
  },
  {
    key: "cultural",
    label: "Cultural activities",
    description: "Facilities and Achievements pages.",
    defaultPath: "/images/cultural.jpg",
  },
] as const;

export type SiteImageKey = (typeof SITE_IMAGE_SLOTS)[number]["key"];

export const DEFAULT_SITE_IMAGES = Object.fromEntries(
  SITE_IMAGE_SLOTS.map(({ key, defaultPath }) => [key, defaultPath]),
) as Record<SiteImageKey, string>;

export function isSiteImageKey(value: string): value is SiteImageKey {
  return SITE_IMAGE_SLOTS.some((slot) => slot.key === value);
}
