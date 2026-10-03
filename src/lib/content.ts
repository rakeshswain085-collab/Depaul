// ============================================================================
//                      WEBSITE CONTENT — EDIT THIS FILE
// ----------------------------------------------------------------------------
//  Everything on the website is controlled from this single file.
//  No database and no login is required.
//
//  HOW TO ADD YOUR OWN PHOTOS:
//    1. Copy your JPG / PNG files into the folder  public/images/
//       (gallery photos go into  public/images/gallery/  — see photo-01.jpg
//       etc. You can simply replace those files with your own, keeping the
//       same file names).
//    2. Use the path starting with "/images/..." below.
//
//  Dates are written as "YYYY-MM-DD", for example "2026-09-23".
// ============================================================================

export type Notice = {
  title: string;
  body: string;
  /** Short label shown above the title, e.g. "NOTICE", "LATEST NOTICE". */
  category: string;
  /** Date as YYYY-MM-DD */
  noticeDate: string;
  /** true = pinned to the top of the notice board */
  isPinned?: boolean;
};

export type SchoolEvent = {
  title: string;
  description: string;
  /** Date as YYYY-MM-DD */
  eventDate: string;
  venue: string;
  /** "Upcoming" or "Completed" */
  status: "Upcoming" | "Completed";
  /** Optional photo shown on the events page, path under /images/... */
  imageUrl?: string;
};

export type GalleryPhoto = {
  /** Folder name — photos with the same folder are grouped together. */
  category: string;
  title: string;
  /** Path under public/, e.g. "/images/gallery/photo-01.jpg" */
  imageUrl: string;
  caption?: string;
  /** Order inside the folder (smaller number = earlier). */
  sortOrder?: number;
};

export type LeadershipMessage = {
  role: "chairman" | "principal";
  name: string;
  designation: string;
  heading: string;
  body: string;
  photoUrl?: string;
};

export type BookListItem = {
  className: string;
  subject: string;
  title: string;
  publisher: string;
};

// ----------------------------------------------------------------------------
// NOTICES  (latest first — pinned notices always stay on top)
// ----------------------------------------------------------------------------
export const NOTICES: Notice[] = [
  {
    title: "Parent-Teacher Meeting",
    body: "Parents are requested to attend the scheduled interaction with class teachers to discuss the academic progress of their ward.",
    category: "LATEST NOTICE",
    noticeDate: "2026-09-23",
    isPinned: true,
  },
  {
    title: "Half-Yearly Examination",
    body: "Students and parents are requested to check the examination schedule and instructions carefully before the examination begins.",
    category: "NOTICE",
    noticeDate: "2026-09-20",
  },
  {
    title: "School Announcement",
    body: "Please check this website regularly for important school announcements, holidays and activity updates.",
    category: "NOTICE",
    noticeDate: "2026-09-15",
  },
  {
    title: "Annual Function Rehearsal",
    body: "All participating students must attend the rehearsal scheduled after class hours in the school auditorium.",
    category: "NOTICE",
    noticeDate: "2026-09-08",
  },
];

// ----------------------------------------------------------------------------
// EVENTS  ("Upcoming" events are shown before completed ones)
// ----------------------------------------------------------------------------
export const EVENTS: SchoolEvent[] = [
  {
    title: "Science Exhibition",
    description:
      "Students present creative science models, experiments and learning activities for parents and visitors.",
    eventDate: "2026-11-14",
    venue: "Science Block",
    status: "Upcoming",
    imageUrl: "/images/science-lab.jpg",
  },
  {
    title: "Annual Sports",
    description:
      "A day of sports, teamwork and healthy participation for our students across all classes.",
    eventDate: "2026-12-05",
    venue: "School Playground",
    status: "Upcoming",
    imageUrl: "/images/sports.jpg",
  },
  {
    title: "Annual Function",
    description:
      "A celebration of student talent, achievements and school activities with cultural performances.",
    eventDate: "2027-01-24",
    venue: "School Auditorium",
    status: "Upcoming",
    imageUrl: "/images/cultural.jpg",
  },
  {
    title: "Independence Day Celebration",
    description:
      "Flag hoisting, patriotic songs and cultural programme by our students on the school campus.",
    eventDate: "2026-08-15",
    venue: "School Ground",
    status: "Completed",
    imageUrl: "/images/campus.jpg",
  },
];

// ----------------------------------------------------------------------------
// GALLERY PHOTOS
//   Put your photographs in  public/images/gallery/  and list them here.
//   Folders appear in the order they are first used below.
// ----------------------------------------------------------------------------
export const GALLERY_PHOTOS: GalleryPhoto[] = [
  {
    category: "School Campus",
    title: "School Building",
    imageUrl: "/images/gallery/campus.jpg",
    caption: "De-Paul Senior Secondary School campus view",
    sortOrder: 1,
  },
  {
    category: "School Campus",
    title: "Campus View",
    imageUrl: "/images/gallery/campus2.jpg",
    caption: "The main academic block at Rankanath Vihar",
    sortOrder: 2,
  },

  //ACTIVITIES

  {
    category: "School Activities",
    title: "Cultural Programme",
    imageUrl: "/images/gallery/activities/school-activity1.jpeg",
    caption: "Students performing at the annual cultural programme",
    sortOrder: 1,
  },
  {
    category: "School Activities",
    title: "Library Reading Session",
       imageUrl: "/images/gallery/activities/school-activity2.jpeg",
    caption: "Reading session in the school library",
    sortOrder: 2,
  },
    {
    category: "School Activities",
    title: "Library Reading Session",
      imageUrl: "/images/gallery/activities/school-activity3.jpeg",
    caption: "Reading session in the school library",
    sortOrder: 3,
  },
    {
    category: "School Activities",
    title: "Library Reading Session",
       imageUrl: "/images/gallery/activities/school-activity4.jpeg",
    caption: "Reading session in the school library",
    sortOrder: 4,
  },
    {
    category: "School Activities",
    title: "Library Reading Session",
       imageUrl: "/images/gallery/activities/school-activity5.jpeg",
    caption: "Reading session in the school library",
    sortOrder: 5,
  },
    {
    category: "School Activities",
    title: "Library Reading Session",
        imageUrl: "/images/gallery/activities/school-activity6.jpeg",
    caption: "Reading session in the school library",
    sortOrder: 6,
  },
  //EVENTS
  {
    category: "School Events",
    title: "Science Exhibition",
    imageUrl: "/images/gallery/events/school-event1.jpeg",
    caption: "Students demonstrating science models",
    sortOrder: 1,
  },
  {
    category: "School Events",
    title: "Annual Sports Meet",
      imageUrl: "/images/gallery/events/school-event2.jpeg",
    caption: "Sports day march past on the school ground",
    sortOrder: 2,
  },
    {
    category: "School Events",
    title: "Annual Sports Meet",
      imageUrl: "/images/gallery/events/school-event3.jpeg",
    caption: "Sports day march past on the school ground",
    sortOrder: 3,
  },

  //MEMORIES
  {
    category: "School Memories",
    title: "Assembly",
    imageUrl: "/images/gallery/memories/school-memories1.jpeg",
    caption: "Morning assembly on the school ground",
    sortOrder: 1,
  },
  {
    category: "School Memories",
    title: "Classroom Learning",
    imageUrl: "/images/gallery/memories/school-memories2.jpeg",
    caption: "Interactive classroom session",
    sortOrder: 2,
  },
    {
    category: "School Memories",
    title: "Classroom Learning",
    imageUrl: "/images/gallery/memories/school-memories3.jpeg",
    caption: "Interactive classroom session",
    sortOrder: 3,
  },
    {
    category: "School Memories",
    title: "Classroom Learning",
    imageUrl: "/images/gallery/memories/school-memories4.jpeg",
    caption: "Interactive classroom session",
    sortOrder: 4,
  },
    {
    category: "School Memories",
    title: "Classroom Learning",
    imageUrl: "/images/gallery/memories/school-memories5.jpeg",
    caption: "Interactive classroom session",
    sortOrder: 5,
  },
];

// ----------------------------------------------------------------------------
// LEADERSHIP MESSAGES  (portraits live in public/images/)
// ----------------------------------------------------------------------------
export const MESSAGES: LeadershipMessage[] = [
  {
    role: "chairman",
    name: "Mr. Ashok Padhy",
    designation: "Chairman",
    heading: "A Message to Our Students and Parents",
    body: "At De-Paul Senior Secondary School, Aska, we believe that education should nurture knowledge, values, discipline and responsibility. We are committed to creating an environment where every student can learn, grow and contribute positively to society.",
    photoUrl: "/images/chairman.jpg",
  },
  {
    role: "principal",
    name: "Ms. Rajani Panda",
    designation: "Principal",
    heading: "A Message to Our Students and Parents",
    body: "Welcome to De-Paul Senior Secondary School, Aska. We believe that education is a journey of knowledge, character, discipline and discovery. Our school community works together to help every learner develop confidence, responsibility and a spirit of excellence.",
    photoUrl: "/images/principal.jpg",
  },
];

// ----------------------------------------------------------------------------
// ADMISSION TEXT  (shown on the homepage and the Admission page)
// ----------------------------------------------------------------------------
export const ADMISSION = {
  admission_intro:
    "Admissions at De-Paul Senior Secondary School, Aska are open to students from Nursery to Senior Secondary levels. Parents may collect the registration form from the school office on working days between 9:00 AM and 2:00 PM.",
  admission_application:
    "Registration forms are issued from the school office. Duly filled forms must be submitted with a copy of the birth certificate, Aadhaar copy, previous progress report and four passport-size photographs.",
  admission_schedule:
    "Registration opens in February every year. Interaction with students and parents is held in March and the new academic session begins in the first week of April.",
  admission_documents:
    "Transfer Certificate (for Class II and above), original birth certificate, caste certificate (if applicable) and previous school progress report.",
  admission_contact:
    "For any admission related enquiry, please call the school office at +91 94387 67946 or write to depaulschoolaska@gmail.com.",
} as const;

// ----------------------------------------------------------------------------
// BOOK LIST 2026-27
// ----------------------------------------------------------------------------
export const BOOK_LIST: BookListItem[] = [
  { className: "Class I", subject: "English", title: "Marigold – 1", publisher: "NCERT" },
  { className: "Class I", subject: "Mathematics", title: "Math Magic – 1", publisher: "NCERT" },
  { className: "Class I", subject: "Odia", title: "Odia Patha Pustaka – 1", publisher: "OSEB" },
  { className: "Class V", subject: "English", title: "Marigold – 5", publisher: "NCERT" },
  { className: "Class V", subject: "Mathematics", title: "Math Magic – 5", publisher: "NCERT" },
  { className: "Class V", subject: "EVS", title: "Looking Around – 5", publisher: "NCERT" },
  { className: "Class VIII", subject: "Science", title: "Science – 8", publisher: "NCERT" },
  { className: "Class VIII", subject: "Mathematics", title: "Mathematics – 8", publisher: "NCERT" },
  { className: "Class VIII", subject: "Social Science", title: "Resource & Development – 8", publisher: "NCERT" },
  { className: "Class X", subject: "Science", title: "Science – 10", publisher: "NCERT" },
  { className: "Class X", subject: "Mathematics", title: "Mathematics – 10", publisher: "NCERT" },
  { className: "Class X", subject: "English", title: "First Flight – 10", publisher: "NCERT" },
  { className: "Class XII (Science)", subject: "Physics", title: "Physics Part I & II – 12", publisher: "NCERT" },
  { className: "Class XII (Science)", subject: "Chemistry", title: "Chemistry Part I & II – 12", publisher: "NCERT" },
  { className: "Class XII (Science)", subject: "Mathematics", title: "Mathematics – 12", publisher: "NCERT" },
  { className: "Class XII (Commerce)", subject: "Accountancy", title: "Accountancy – 12", publisher: "NCERT" },
  { className: "Class XII (Commerce)", subject: "Business Studies", title: "Business Studies – 12", publisher: "NCERT" },
];
