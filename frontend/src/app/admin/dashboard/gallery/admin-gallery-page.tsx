
"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type FormEvent,
} from "react";

type GalleryPhoto = {
  _id?: string;
  id?: string;
  imageUrl: string;
  originalUrl?: string;
  sourceType?: "upload" | "url";
  title?: string;
  category?: string;
  caption?: string;
  year?: number | string;
  createdAt?: string;
};

const CURRENT_YEAR = new Date().getFullYear();

const CATEGORIES = [
  "School Activities",
  "School Events",
  "School Memories",
  "School Campus",
  "Academic Activities",
  "Sports",
  "Cultural Programs",
  "Celebrations",
  "Other",
];

function getPhotoId(photo: GalleryPhoto) {
  return String(photo._id ?? photo.id ?? "");
}

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Something went wrong.";
}

export default function AdminGalleryPage() {
  const [photos, setPhotos] = useState<GalleryPhoto[]>([]);
  const [selectedYear, setSelectedYear] = useState(
    String(CURRENT_YEAR),
  );
  const [customYear, setCustomYear] = useState("");
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [title, setTitle] = useState("");
  const [caption, setCaption] = useState("");
  const [sourceMode, setSourceMode] = useState<"upload" | "url">("upload");
  const [imageUrls, setImageUrls] = useState("");
  const [files, setFiles] = useState<File[]>([]);

  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const fileInputRef = useRef<HTMLInputElement>(null);
  const uploadYear = selectedYear === "other" ? customYear : selectedYear;

  const years = useMemo(() => {
    const values = new Set<number>();

    for (let year = CURRENT_YEAR + 1; year >= 2000; year--) {
      values.add(year);
    }

    for (const photo of photos) {
      const year = Number(photo.year);
      if (Number.isInteger(year) && year >= 1900 && year <= 2100) {
        values.add(year);
      }
    }

    return Array.from(values).sort((a, b) => b - a);
  }, [photos]);

  const loadPhotos = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/admin/gallery", {
        cache: "no-store",
      });
      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.error || result.message || "Failed to load gallery.",
        );
      }

      const list = Array.isArray(result)
        ? result
        : result.photos ?? result.items ?? result.images ?? result.data ?? [];

      setPhotos(Array.isArray(list) ? list : []);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadPhotos();
  }, [loadPhotos]);

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const selected = Array.from(event.target.files ?? []);
    setError("");
    setSuccess("");

    if (selected.length > 20) {
      setError("Select no more than 20 images at once.");
      setFiles([]);
      event.target.value = "";
      return;
    }

    const allowed = [
      "image/jpeg",
      "image/png",
      "image/webp",
      "image/gif",
    ];

    const invalid = selected.find((file) => !allowed.includes(file.type));

    if (invalid) {
      setError(`${invalid.name}: use JPG, PNG, WEBP or GIF.`);
      setFiles([]);
      event.target.value = "";
      return;
    }

    const oversized = selected.find(
      (file) => file.size === 0 || file.size > 10 * 1024 * 1024,
    );

    if (oversized) {
      setError(`${oversized.name} is empty or exceeds the 10 MB limit.`);
      setFiles([]);
      event.target.value = "";
      return;
    }

    setFiles(selected);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSuccess("");

    const year = Number(uploadYear);

    if (
      !/^\d{4}$/.test(uploadYear) ||
      !Number.isInteger(year) ||
      year < 1900 ||
      year > 2100
    ) {
      setError("Select or enter a valid year between 1900 and 2100.");
      return;
    }

    if (!category.trim()) {
      setError("Select a gallery category.");
      return;
    }

    const urls = imageUrls
      .split(/\r?\n/)
      .map((url) => url.trim())
      .filter(Boolean);

    if (sourceMode === "upload" && files.length === 0) {
      setError("Select at least one image from your computer.");
      return;
    }

    if (sourceMode === "url" && urls.length === 0) {
      setError("Paste at least one image URL.");
      return;
    }

    if (sourceMode === "url" && urls.length > 20) {
      setError("You can submit a maximum of 20 URLs at once.");
      return;
    }

    const formData = new FormData();
    formData.append("sourceMode", sourceMode);
    formData.append("year", String(year));
    formData.append("category", category);
    formData.append("title", title.trim());
    formData.append("caption", caption.trim());

    if (sourceMode === "upload") {
      files.forEach((file) => formData.append("images", file));
    } else {
      formData.append("imageUrls", urls.join("\n"));
    }

    setUploading(true);

    try {
      const response = await fetch("/api/admin/gallery", {
        method: "POST",
        body: formData,
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.error || result.message || "Could not save gallery photos.",
        );
      }

      const count = sourceMode === "upload" ? files.length : urls.length;
      setSuccess(
        `${count} image${count === 1 ? "" : "s"} saved successfully for ${year}.`,
      );

      setFiles([]);
      setImageUrls("");
      setTitle("");
      setCaption("");

      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }

      await loadPhotos();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setUploading(false);
    }
  }

  async function handleDelete(photo: GalleryPhoto) {
    const id = getPhotoId(photo);

    if (!id) {
      setError("This image has no database ID.");
      return;
    }

    if (!window.confirm("Delete this gallery image permanently?")) {
      return;
    }

    setError("");
    setSuccess("");
    setDeletingId(id);

    try {
      const response = await fetch(
        `/api/admin/gallery?id=${encodeURIComponent(id)}`,
        { method: "DELETE" },
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.error || result.message || "Failed to delete image.",
        );
      }

      setPhotos((current) =>
        current.filter((photo) => getPhotoId(photo) !== id),
      );
      setSuccess("Gallery image deleted successfully.");
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setDeletingId(null);
    }
  }

  const sortedPhotos = [...photos].sort((a, b) => {
    const yearDifference = Number(b.year ?? 0) - Number(a.year ?? 0);

    if (yearDifference !== 0) return yearDifference;

    return (
      new Date(b.createdAt ?? 0).getTime() -
      new Date(a.createdAt ?? 0).getTime()
    );
  });

  const latestYear = Math.max(
    ...photos.map((photo) => Number(photo.year ?? 0)),
    0,
  );

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8 text-slate-900 sm:px-6 lg:px-10">
      <div className="mx-auto max-w-7xl space-y-8">
        <header className="flex flex-col justify-between gap-4 border-b border-slate-200 pb-6 sm:flex-row sm:items-end">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.25em] text-amber-700">
              School Administration
            </p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
              Gallery Management
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
              Upload school photos or add image links, organize them by year
              and category, and manage your public gallery.
            </p>
          </div>

          <button
            type="button"
            onClick={() => void loadPhotos()}
            disabled={loading}
            className="min-h-11 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold shadow-sm hover:bg-slate-100 disabled:opacity-50"
          >
            ↻ Refresh gallery
          </button>
        </header>

        {error && (
          <div
            role="alert"
            className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
          >
            <strong>Error: </strong>{error}
          </div>
        )}

        {success && (
          <div
            role="status"
            className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800"
          >
            {success}
          </div>
        )}

        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 px-5 py-5 sm:px-7">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-amber-700">
              Add photos
            </p>
            <h2 className="mt-1 text-xl font-bold">
              Upload to school gallery
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Choose your image source, year, and category.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6 p-5 sm:p-7">
            <div>
              <span className="mb-2 block text-sm font-semibold text-slate-700">
                Image source *
              </span>
              <div className="grid gap-3 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={() => {
                    setSourceMode("upload");
                    setError("");
                    setSuccess("");
                  }}
                  className={`rounded-xl border p-4 text-left transition ${
                    sourceMode === "upload"
                      ? "border-amber-500 bg-amber-50 ring-2 ring-amber-100"
                      : "border-slate-200 hover:bg-slate-50"
                  }`}
                >
                  <span className="block font-bold">Upload from computer</span>
                  <span className="mt-1 block text-xs text-slate-500">
                    JPG, PNG, WEBP or GIF files
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setSourceMode("url");
                    setError("");
                    setSuccess("");
                  }}
                  className={`rounded-xl border p-4 text-left transition ${
                    sourceMode === "url"
                      ? "border-amber-500 bg-amber-50 ring-2 ring-amber-100"
                      : "border-slate-200 hover:bg-slate-50"
                  }`}
                >
                  <span className="block font-bold">Paste image URLs</span>
                  <span className="mt-1 block text-xs text-slate-500">
                    Direct image links and supported Drive links
                  </span>
                </button>
              </div>
            </div>

            <div className="grid gap-5 md:grid-cols-2">
              <div>
                <label
                  htmlFor="gallery-year"
                  className="mb-2 block text-sm font-semibold text-slate-700"
                >
                  Academic / Event Year *
                </label>
                <select
                  id="gallery-year"
                  value={selectedYear}
                  onChange={(event) => setSelectedYear(event.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-amber-500 focus:ring-4 focus:ring-amber-100"
                >
                  {years.map((year) => (
                    <option key={year} value={String(year)}>
                      {year}{year === CURRENT_YEAR ? " (Current Year)" : ""}
                    </option>
                  ))}
                  <option value="other">Enter another year...</option>
                </select>

                {selectedYear === "other" && (
                  <input
                    type="number"
                    min={1900}
                    max={2100}
                    value={customYear}
                    onChange={(event) => setCustomYear(event.target.value)}
                    placeholder="Enter year, e.g. 1999"
                    required
                    className="mt-3 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-amber-500 focus:ring-4 focus:ring-amber-100"
                  />
                )}
              </div>

              <div>
                <label
                  htmlFor="gallery-category"
                  className="mb-2 block text-sm font-semibold text-slate-700"
                >
                  Event Category *
                </label>
                <select
                  id="gallery-category"
                  value={category}
                  onChange={(event) => setCategory(event.target.value)}
                  required
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-amber-500 focus:ring-4 focus:ring-amber-100"
                >
                  {CATEGORIES.map((item) => (
                    <option key={item} value={item}>{item}</option>
                  ))}
                </select>
              </div>

              <div>
                <label
                  htmlFor="gallery-title"
                  className="mb-2 block text-sm font-semibold text-slate-700"
                >
                  Photo Title
                </label>
                <input
                  id="gallery-title"
                  type="text"
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                  maxLength={150}
                  placeholder="e.g. Annual Sports Day"
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-amber-500 focus:ring-4 focus:ring-amber-100"
                />
              </div>

              <div>
                <label
                  htmlFor="gallery-caption"
                  className="mb-2 block text-sm font-semibold text-slate-700"
                >
                  Caption / Description
                </label>
                <input
                  id="gallery-caption"
                  type="text"
                  value={caption}
                  onChange={(event) => setCaption(event.target.value)}
                  maxLength={300}
                  placeholder="Short description of the photos"
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-amber-500 focus:ring-4 focus:ring-amber-100"
                />
              </div>
            </div>

            {sourceMode === "upload" ? (
              <div>
                <label
                  htmlFor="gallery-images"
                  className="mb-2 block text-sm font-semibold text-slate-700"
                >
                  Select images *
                </label>
                <div className="rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50 p-6 text-center hover:border-amber-400 sm:p-8">
                  <p className="text-sm font-semibold">
                    Choose photos from your computer
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    JPG, PNG, WEBP or GIF · Maximum 10 MB per image · Up to 20
                    images
                  </p>
                  <input
                    ref={fileInputRef}
                    id="gallery-images"
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/gif"
                    multiple
                    onChange={handleFileChange}
                    className="mx-auto mt-4 block w-full max-w-sm text-sm file:mr-3 file:cursor-pointer file:rounded-lg file:border-0 file:bg-slate-900 file:px-4 file:py-2.5 file:font-semibold file:text-white"
                  />
                </div>

                {files.length > 0 && (
                  <p className="mt-3 text-sm text-slate-600">
                    {files.length} image{files.length === 1 ? "" : "s"} selected
                  </p>
                )}
              </div>
            ) : (
              <div>
                <label
                  htmlFor="gallery-urls"
                  className="mb-2 block text-sm font-semibold text-slate-700"
                >
                  Image URLs *
                </label>
                <textarea
                  id="gallery-urls"
                  value={imageUrls}
                  onChange={(event) => setImageUrls(event.target.value)}
                  rows={5}
                  placeholder={
                    "Paste one image URL per line:\nhttps://example.com/school-event.jpg\nhttps://example.com/sports-day.png"
                  }
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-amber-500 focus:ring-4 focus:ring-amber-100"
                />
                <p className="mt-2 text-xs leading-5 text-slate-500">
                  Paste direct public image URLs, one per line (up to 20).
                  Google Drive links may work when the file is publicly
                  accessible. Google Photos sharing pages and ordinary
                  website pages are not necessarily direct image URLs.
                </p>
                {imageUrls.trim() && (
                  <p className="mt-2 text-sm text-slate-600">
                    {imageUrls.split(/\r?\n/).filter((url) => url.trim()).length}
                    {" "}URL(s) entered
                  </p>
                )}
              </div>
            )}

            <div className="flex flex-col gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-xs text-slate-500">
                Destination: {uploadYear || "Select a year"} / {category}
              </p>
              <button
                type="submit"
                disabled={
                  uploading ||
                  (sourceMode === "upload" && files.length === 0) ||
                  (sourceMode === "url" && !imageUrls.trim())
                }
                className="min-h-12 rounded-xl bg-slate-900 px-6 py-3 text-sm font-bold text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {uploading
                  ? "Saving..."
                  : sourceMode === "upload"
                    ? `Upload ${files.length || ""} ${files.length === 1 ? "image" : "images"}`.trim()
                    : "Save image URLs"}
              </button>
            </div>
          </form>
        </section>

        <section>
          <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-amber-700">
                Saved photos
              </p>
              <h2 className="mt-1 text-2xl font-bold">Manage gallery images</h2>
              <p className="mt-1 text-sm text-slate-500">
                Images loaded from your gallery API.
              </p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white px-4 py-2.5">
              <span className="text-sm text-slate-500">Total images: </span>
              <span className="font-bold tabular-nums">{photos.length}</span>
            </div>
          </div>

          {loading ? (
            <p className="rounded-xl bg-white p-8 text-center text-slate-500">
              Loading gallery...
            </p>
          ) : photos.length === 0 ? (
            <p className="rounded-xl border border-dashed border-slate-300 bg-white p-12 text-center text-slate-500">
              No gallery photos found. Add your first image above.
            </p>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {sortedPhotos.map((photo, index) => {
                const id = getPhotoId(photo);
                const latest = Number(photo.year) === latestYear;

                return (
                  <article
                    key={id || `${photo.imageUrl}-${index}`}
                    className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
                  >
                    <div className="relative aspect-[4/3] bg-slate-100">
                      <img
                        src={photo.imageUrl}
                        alt={photo.title || "School gallery photo"}
                        loading="lazy"
                        className="h-full w-full object-cover"
                      />
                      {latest && (
                        <span className="absolute left-3 top-3 rounded-full bg-amber-400 px-3 py-1 text-[10px] font-extrabold uppercase tracking-wider text-slate-950">
                          Latest Year
                        </span>
                      )}
                      <span className="absolute bottom-3 right-3 rounded-lg bg-black/70 px-2.5 py-1 text-xs font-semibold text-white">
                        {photo.year ?? "Year not set"}
                      </span>
                    </div>

                    <div className="space-y-3 p-4">
                      <div>
                        <h3 className="truncate text-sm font-bold">
                          {photo.title || "Untitled photo"}
                        </h3>
                        <p className="mt-1 text-xs font-semibold text-amber-700">
                          {photo.category || "Uncategorized"}
                        </p>
                        {photo.sourceType && (
                          <p className="mt-1 text-xs text-slate-400">
                            Source: {photo.sourceType === "url" ? "External URL" : "Computer upload"}
                          </p>
                        )}
                        {photo.caption && (
                          <p className="mt-2 line-clamp-2 text-xs leading-5 text-slate-500">
                            {photo.caption}
                          </p>
                        )}
                      </div>

                      <div className="flex items-center justify-between gap-2 border-t border-slate-100 pt-3">
                        <span className="text-xs text-slate-400">
                          {photo.createdAt
                            ? new Date(photo.createdAt).toLocaleDateString("en-IN")
                            : "Saved photo"}
                        </span>
                        <button
                          type="button"
                          onClick={() => void handleDelete(photo)}
                          disabled={!id || deletingId === id}
                          className="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-bold text-red-600 hover:bg-red-50 disabled:opacity-50"
                        >
                          {deletingId === id ? "Deleting..." : "Delete"}
                        </button>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
