# De-Paul Senior Secondary School, Aska — Website

A **fully static** school website built with Next.js. **No database, no login,
no admin panel** — all content is edited by hand in two files and all photos
are plain image files.

## How to change website content

All text content (notices, events, gallery captions, leadership messages,
admission information, book list) lives in one file:

```
src/lib/content.ts
```

Open it, edit the entries, save, and rebuild. Each section is clearly marked
with comments and examples. Dates use the `YYYY-MM-DD` format.

School-wide details (name, address, phone, email, affiliation number, YouTube
and magazine links, navigation) are in:

```
src/lib/site.ts
```

## How to add your own photographs

All images live in `public/images/`:

| File | Used for |
|------|----------|
| `hero-campus.jpg` | Big homepage banner |
| `campus.jpg` | About section / cards |
| `chairman.jpg` | Chairman portrait |
| `principal.jpg` | Principal portrait |
| `science-lab.jpg`, `sports.jpg`, `cultural.jpg`, `library.jpg` | Facilities, events, activities |
| `gallery/photo-01.jpg` … `photo-08.jpg` | Gallery folders |

**To use your own photos:** simply replace any of these files with your own
JPG/PNG using the **same file name** — the website updates automatically.

To add **more** gallery photos: drop a new file into
`public/images/gallery/` (for example `photo-09.jpg`) and add one entry in
`GALLERY_PHOTOS` inside `src/lib/content.ts`:

```ts
{
  category: "School Events",          // folder name
  title: "Annual Day 2027",
  imageUrl: "/images/gallery/photo-09.jpg",
  caption: "Prize distribution",
},
```

## Enquiry form

The contact/admission form opens the visitor's email app with a ready-made
message addressed to `depaulschoolaska@gmail.com` — nothing is stored on a
server.

## Commands

```bash
npm run dev    # local development
npm run build  # production build
npm run start  # run the production build
```
