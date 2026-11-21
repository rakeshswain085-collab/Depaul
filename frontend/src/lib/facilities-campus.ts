import type { SiteImageKey } from "@/lib/site-images";

export type CampusFacility = {
  id: string;
  slug: string;
  photoCategory: string;
  title: string;
  description: string;
  icon: string;
  imageSlot: SiteImageKey | null;
  sortOrder: number;
  published: boolean;
};

export const CAMPUS_STARTER_FACILITIES: CampusFacility[] = [
  {
    id: "science-laboratories",
    slug: "science-laboratories",
    photoCategory: "Science Laboratories",
    title: "Science Laboratories",
    description:
      "Separate physics, chemistry and biology work areas where students perform experiments linked to their syllabus.",
    icon: "🔬",
    imageSlot: "scienceLab",
    sortOrder: 0,
    published: true,
  },
  {
    id: "library-reading-room",
    slug: "library-reading-room",
    photoCategory: "Library & Reading Room",
    title: "Library & Reading Room",
    description:
      "A calm reading space with story books, reference titles, newspapers and magazines for all age groups.",
    icon: "📚",
    imageSlot: "library",
    sortOrder: 1,
    published: true,
  },
  {
    id: "playground-sports",
    slug: "playground-sports",
    photoCategory: "Playground & Sports",
    title: "Playground & Sports",
    description:
      "Open ground for athletics, football, kabaddi, volleyball and annual sports day competitions.",
    icon: "⚽",
    imageSlot: "sports",
    sortOrder: 2,
    published: true,
  },
  {
    id: "auditorium-stage",
    slug: "auditorium-stage",
    photoCategory: "Auditorium & Stage",
    title: "Auditorium & Stage",
    description:
      "A stage and assembly area used for cultural programmes, competitions, celebrations and school functions.",
    icon: "🎭",
    imageSlot: "cultural",
    sortOrder: 3,
    published: true,
  },
];
