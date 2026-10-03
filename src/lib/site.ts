export const SCHOOL = {
  name: "De-Paul Senior Secondary School",
  shortName: "De-Paul School, Aska",
  tagline: "26 Years of Academic Excellence",
  established: "2000",
  affiliation: "1530153",
  board: "Central Board of Secondary Education",
  address:
    "Rankanath Vihar, College Square, Nuagam, Aska, Ganjam, Odisha – 761111",
  phone: "+91 94387 67946",
  phoneHref: "+919438767946",
  email: "depaulschoolaska@gmail.com",
  youtube: "https://www.youtube.com/@de-paulschoolaska1840",
  magazine: "https://heyzine.com/flip-book/de-paul-school-aska.html",
  mapQuery:
    "De-Paul Senior Secondary School, Rankanath Vihar, College Square, Nuagam, Aska, Ganjam, Odisha 761111",
} as const;

export const MAPS_LINK = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
  SCHOOL.mapQuery,
)}`;

export const MAPS_EMBED = `https://maps.google.com/maps?q=${encodeURIComponent(
  SCHOOL.mapQuery,
)}&t=&z=14&ie=UTF8&iwloc=&output=embed`;

export const NAV_LINKS = [
  { href: "/", label: "Home" },
  { href: "/about", label: "About Us" },
  { href: "/#messages", label: "Messages" },
  { href: "/events", label: "Events" },
  { href: "/gallery", label: "Gallery" },
  { href: "/notices", label: "Notice" },
  { href: "/academics", label: "Academics" },
  { href: "/facilities", label: "Facilities" },
  { href: "/achievements", label: "Achievements" },
  { href: "/admission", label: "Admission" },
  { href: "/contact", label: "Contact" },
] as const;

export const UTILITY_LINKS = [
  { href: "/affiliation", label: "Affiliation" },
  { href: "/mandatory-disclosure", label: "Mandatory Disclosure" },
  { href: "/book-list", label: "Book List 2026-27" },
] as const;

export const ACADEMICS = [
  {
    icon: "📘",
    title: "Primary & Middle School",
    description:
      "Strong foundations through activity-based learning, language development and core subjects.",
  },
  {
    icon: "🔬",
    title: "Secondary School",
    description:
      "Focused learning in Science, Mathematics, Languages, Social Science and other school subjects.",
  },
  {
    icon: "🎓",
    title: "Senior Secondary",
    description:
      "Academic preparation with subject-focused learning and guidance for higher education.",
  },
] as const;

export const FACILITIES = [
  {
    icon: "🔬",
    title: "Science Laboratories",
    description: "Learning through experiments and practical activities.",
  },
  {
    icon: "📚",
    title: "Library",
    description: "A reading and learning space for students.",
  },
  {
    icon: "💻",
    title: "Smart Learning",
    description: "Technology-supported classroom learning.",
  },
  {
    icon: "⚽",
    title: "Sports & Games",
    description: "Opportunities for physical activity and teamwork.",
  },
  {
    icon: "🎨",
    title: "Creative Activities",
    description: "Art, cultural and co-curricular opportunities.",
  },
  {
    icon: "🚌",
    title: "School Transport",
    description: "School transport information can be published here.",
  },
] as const;

export const ACHIEVEMENTS = [
  {
    icon: "🏆",
    title: "Academic Excellence",
    description: "Celebrate student achievements and examination results.",
  },
  {
    icon: "🥇",
    title: "Sports Achievements",
    description: "Showcase participation, medals and school-level sports events.",
  },
  {
    icon: "🌟",
    title: "Cultural Activities",
    description: "Share performances, celebrations and creative accomplishments.",
  },
  {
    icon: "🧪",
    title: "Science & Innovation",
    description: "Highlight exhibitions, models, projects and innovation activities.",
  },
] as const;

export const GALLERY_CATEGORIES = [
  "School Campus",
  "School Activities",
  "School Events",
  "School Memories",
] as const;

export const MANDATORY_DISCLOSURE = [
  { label: "Name of the School", value: "De-Paul Senior Secondary School, Aska" },
  { label: "Affiliation Number", value: "1530153" },
  { label: "School Code", value: "15344" },
  { label: "Board", value: "Central Board of Secondary Education (CBSE)" },
  { label: "School Category", value: "Senior Secondary (Co-educational)" },
  { label: "Classes Offered", value: "Nursery to Class XII" },
  { label: "Year of Establishment", value: "2000" },
  { label: "Address", value: SCHOOL.address },
  { label: "District / State", value: "Ganjam, Odisha – 761111" },
  { label: "Principal", value: "Ms. Rajani Panda" },
  { label: "Chairman", value: "Mr. Ashok Padhy" },
  { label: "School Email", value: SCHOOL.email },
  { label: "School Telephone", value: SCHOOL.phone },
  { label: "Nature of the School", value: "Private, Unaided" },
  { label: "Type of Management", value: "Society / Trust managed" },
] as const;
