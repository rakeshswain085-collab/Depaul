
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
import Image from "next/image";

type GalleryPhoto = {
  _id?: string;
  id?: string;
  imageUrl: string;
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
  "Academic Activities",
  "Sports",
  "Cultural Programs",
  "Celebrations",
  "Other",
];

function getPhotoId(photo: GalleryPhoto): string {
  return String(photo._id ?? photo.id ?? "");
}

function getErrorMessage(error: unknown): string {
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
  const [files, setFiles] = useState<File[]>([]);

  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const fileInputRef = useRef<HTMLInputElement>(null);

  const uploadYear = selectedYear === "other" ? customYear : selectedYear;

  const years = useMemo(() => {
    const availableYears = new Set<number>();

    for (let year = CURRENT_YEAR + 1; year >= 2000; year--) {
      availableYears.add(year);
    }

    for (const photo of photos) {
      const year = Number(photo.year);
      if (Number.isInteger(year) && year >= 1900 && year <= 2100) {
        availableYears.add(year);
      }
    }

    return Array.from(availableYears).sort((a, b) => b - a);
  }, [photos]);

  const loadPhotos = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/admin/gallery", {
        method: "GET",
        cache: "no-store",
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to load gallery photos.");
      }

      const list = Array.isArray(result)
        ? result
        : result.photos ?? result.images ?? result.data ?? [];

      setPhotos(Array.isArray(list) ? list : []);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadPhotos();
  }, [loadPhotos]);

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const selectedFiles = Array.from(event.target.files ?? []);

    setError("");
    setSuccess("");

    if (selectedFiles.length > 20) {
      setError("You can upload a maximum of 20 images at a time.");
      setFiles([]);
      event.target.value = "";
      return;
    }

    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/webp",
      "image/gif",
    ];

    const invalidFile = selectedFiles.find(
      (file) => !allowedTypes.includes(file.type),
    );

    if (invalidFile) {
      setError(
        `${invalidFile.name} is not supported. Use JPG, PNG, WEBP, or GIF.`,
      );
      setFiles([]);
      event.target.value = "";
      return;
    }

    const oversizedFile = selectedFiles.find(
      (file) => file.size > 10 * 1024 * 1024,
    );

    if (oversizedFile) {
      setError(`${oversizedFile.name} exceeds the 10 MB limit.`);
      setFiles([]);
      event.target.value = "";
      return;
    }

    setFiles(selectedFiles);
  }

  async function handleUpload(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setError("");
    setSuccess("");

    const yearNumber = Number(uploadYear);

    if (
      !/^\d{4}$/.test(uploadYear) ||
      !Number.isInteger(yearNumber) ||
      yearNumber < 1900 ||
      yearNumber > 2100
    ) {
      setError("Please select or enter a valid year between 1900 and 2100.");
      return;
    }

    if (files.length === 0) {
      setError("Please select at least one image to upload.");
      return;
    }

    if (!category.trim()) {
      setError("Please select an event category.");
      return;
    }

    const formData = new FormData();

    files.forEach((file) => {
      formData.append("images", file);
    });

    formData.append("year", String(yearNumber));
    formData.append("category", category);
    formData.append("title", title.trim());
    formData.append("caption", caption.trim());

    setUploading(true);

    try {
      const response = await fetch("/api/admin/gallery", {
        method: "POST",
        body: formData,
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Image upload failed.");
      }

      setSuccess(
        `${files.length} image${files.length === 1 ? "" : "s"} uploaded successfully for ${yearNumber}.`,
      );

      setFiles([]);
      setTitle("");
      setCaption("");

      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }

      await loadPhotos();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setUploading(false);
    }
  }

  async function handleDelete(photo: GalleryPhoto) {
    const id = getPhotoId(photo);

    if (!id) {
      setError("This photo has no database ID, so it cannot be deleted.");
      return;
    }

    const confirmed = window.confirm(
      "Are you sure you want to delete this gallery image? This action cannot be undone.",
    );

    if (!confirmed) return;

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
        throw new Error(result.error || "Failed to delete image.");
      }

      setPhotos((current) =>
        current.filter((item) => getPhotoId(item) !== id),
      );

      setSuccess("Image deleted successfully.");
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8 text-slate-900 sm:px-6 lg:px-10">
      <div className="mx-auto max-w-7xl space-y-8">
        {/* Page header */}
        <header className="flex flex-col justify-between gap-4 border-b border-slate-200 pb-6 sm:flex-row sm:items-end">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.25em] text-amber-700">
              School Administration
            </p>

            <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
              Gallery Management
            </h1>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
              Upload school photos, organize them by academic year and event,
              and manage the images displayed in the public gallery.
            </p>
          </div>

          <button
            type="button"
            onClick={() => void loadPhotos()}
            disabled={loading}
            className="inline-flex min-h-11 items-center justify-center gap-2 self-start rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold shadow-sm transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50 sm:self-auto"
          >
            <span aria-hidden="true">↻</span>
            Refresh gallery
          </button>
        </header>

        {/* Status messages */}
        {error && (
          <div
            role="alert"
            className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
          >
            <strong className="mr-1">Error:</strong>
            {error}
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

        {/* Upload form */}
        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 px-5 py-5 sm:px-7">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-amber-700">
              Add photos
            </p>
            <h2 className="mt-1 text-xl font-bold">Upload to school gallery</h2>
            <p className="mt-1 text-sm text-slate-500">
              Choose a year and category before uploading your images.
            </p>
          </div>

          <form onSubmit={handleUpload} className="space-y-6 p-5 sm:p-7">
            <div className="grid gap-5 md:grid-cols-2">
              {/* Year */}
              <div>
                <label
                  htmlFor="gallery-year"
                  className="mb-2 block text-sm font-semibold text-slate-700"
                >
                  Academic / Event Year <span className="text-red-500">*</span>
                </label>

                <select
                  id="gallery-year"
                  value={selectedYear}
                  onChange={(event) => setSelectedYear(event.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-amber-500 focus:ring-4 focus:ring-amber-100"
                >
                  {years.map((year) => (
                    <option key={year} value={String(year)}>
                      {year}
                      {year === CURRENT_YEAR ? " (Current Year)" : ""}
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
                    className="mt-3 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-amber-500 focus:ring-4 focus:ring-amber-100"
                    required
                  />
                )}

                <p className="mt-2 text-xs text-slate-500">
                  Photos from the newest year can be highlighted on the public gallery.
                </p>
              </div>

              {/* Category */}
              <div>
                <label
                  htmlFor="gallery-category"
                  className="mb-2 block text-sm font-semibold text-slate-700"
                >
                  Event Category <span className="text-red-500">*</span>
                </label>

                <select
                  id="gallery-category"
                  value={category}
                  onChange={(event) => setCategory(event.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-amber-500 focus:ring-4 focus:ring-amber-100"
                  required
                >
                  {CATEGORIES.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
              </div>

              {/* Title */}
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
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-amber-500 focus:ring-4 focus:ring-amber-100"
                />
              </div>

              {/* Caption */}
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
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-amber-500 focus:ring-4 focus:ring-amber-100"
                />
              </div>
            </div>

            {/* File input */}
            <div>
              <label
                htmlFor="gallery-images"
                className="mb-2 block text-sm font-semibold text-slate-700"
              >
                Select Images <span className="text-red-500">*</span>
              </label>

              <div className="rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50 p-6 text-center transition hover:border-amber-400 hover:bg-amber-50/30 sm:p-8">
                <div className="text-3xl" aria-hidden="true">
                  ▧
                </div>

                <p className="mt-2 text-sm font-semibold text-slate-800">
                  Choose photos from your computer
                </p>

                <p className="mt-1 text-xs text-slate-500">
                  JPG, PNG, WEBP or GIF · Maximum 10 MB per image · Up to 20 images
                </p>

                <input
                  ref={fileInputRef}
                  id="gallery-images"
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  multiple
                  onChange={handleFileChange}
                  className="mx-auto mt-4 block w-full max-w-sm text-sm text-slate-600 file:mr-3 file:cursor-pointer file:rounded-lg file:border-0 file:bg-slate-900 file:px-4 file:py-2.5 file:font-semibold file:text-white hover:file:bg-slate-700"
                />
              </div>
            </div>

            {/* Selected files */}
            {files.length > 0 && (
              <div className="rounded-xl border border-slate-200 p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-sm font-semibold">
                    {files.length} image{files.length === 1 ? "" : "s"} selected
                  </p>

                  <button
                    type="button"
                    onClick={() => {
                      setFiles([]);
                      if (fileInputRef.current) {
                        fileInputRef.current.value = "";
                      }
                    }}
                    className="text-xs font-semibold text-red-600 hover:text-red-800"
                  >
                    Clear selection
                  </button>
                </div>

                <ul className="mt-3 space-y-2">
                  {files.map((file, index) => (
                    <li
                      key={`${file.name}-${file.size}-${index}`}
                      className="flex items-center justify-between gap-3 text-sm"
                    >
                      <span className="min-w-0 truncate text-slate-700">
                        {file.name}
                      </span>
                      <span className="shrink-0 text-xs text-slate-400">
                        {(file.size / (1024 * 1024)).toFixed(2)} MB
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="flex flex-col gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-xs text-slate-500">
                Upload destination: {uploadYear || "Select a year"} / {category}
              </p>

              <button
                type="submit"
                disabled={uploading || files.length === 0}
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-slate-900 px-6 py-3 text-sm font-bold text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {uploading ? (
                  <>
                    <span
                      className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white"
                      aria-hidden="true"
                    />
                    Uploading...
                  </>
                ) : (
                  <>Upload {files.length > 0 ? `${files.length} image${files.length === 1 ? "" : "s"}` : "Images"}</>
                )}
              </button>
            </div>
          </form>
        </section>

        {/* Gallery list */}
        <section>
          <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-amber-700">
                Saved photos
              </p>
              <h2 className="mt-1 text-2xl font-bold">Manage gallery images</h2>
              <p className="mt-1 text-sm text-slate-500">
                These images are loaded from your gallery API.
              </p>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white px-4 py-2.5">
              <span className="text-sm text-slate-500">Total images: </span>
              <span className="font-bold tabular-nums">{photos.length}</span>
            </div>
          </div>

          {loading ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {Array.from({ length: 8 }).map((_, index) => (
                <div
                  key={index}
                  className="animate-pulse overflow-hidden rounded-2xl border border-slate-200 bg-white"
                >
                  <div className="aspect-[4/3] bg-slate-200" />
                  <div className="space-y-2 p-4">
                    <div className="h-4 w-2/3 rounded bg-slate-200" />
                    <div className="h-3 w-1/2 rounded bg-slate-100" />
                  </div>
                </div>
              ))}
            </div>
          ) : photos.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-5 py-16 text-center">
              <p className="text-lg font-semibold text-slate-800">
                No gallery photos found
              </p>
              <p className="mt-2 text-sm text-slate-500">
                Upload your first school photo using the form above.
              </p>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {[...photos]
                .sort((a, b) => {
                  const yearDifference =
                    Number(b.year ?? 0) - Number(a.year ?? 0);

                  if (yearDifference !== 0) return yearDifference;

                  return (
                    new Date(b.createdAt ?? 0).getTime() -
                    new Date(a.createdAt ?? 0).getTime()
                  );
                })
                .map((photo, index, sortedPhotos) => {
                  const id = getPhotoId(photo);
                  const latestYear = Math.max(
                    ...sortedPhotos.map((item) => Number(item.year ?? 0)),
                    0,
                  );
                  const isLatestYear =
                    Number(photo.year) > 0 &&
                    Number(photo.year) === latestYear;

                  return (
                    <article
                      key={id || `${photo.imageUrl}-${index}`}
                      className="group overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                    >
                      <div className="relative aspect-[4/3] overflow-hidden bg-slate-100">
                        <Image
                          src={photo.imageUrl}
                          alt={photo.title || "School gallery photo"}
                          fill
                          unoptimized
                          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                          className="object-cover transition duration-500 group-hover:scale-105"
                        />

                        {isLatestYear && (
                          <span className="absolute left-3 top-3 rounded-full bg-amber-400 px-3 py-1 text-[10px] font-extrabold uppercase tracking-wider text-slate-950 shadow">
                            Latest Year
                          </span>
                        )}

                        <span className="absolute bottom-3 right-3 rounded-lg bg-black/70 px-2.5 py-1 text-xs font-semibold text-white">
                          {photo.year ?? "Year not set"}
                        </span>
                      </div>

                      <div className="space-y-3 p-4">
                        <div>
                          <h3 className="truncate text-sm font-bold text-slate-900">
                            {photo.title || "Untitled photo"}
                          </h3>

                          <p className="mt-1 text-xs font-semibold text-amber-700">
                            {photo.category || "Uncategorized"}
                          </p>

                          {photo.caption && (
                            <p className="mt-2 line-clamp-2 text-xs leading-5 text-slate-500">
                              {photo.caption}
                            </p>
                          )}
                        </div>

                        <div className="flex items-center justify-between border-t border-slate-100 pt-3">
                          <span className="text-xs text-slate-400">
                            {photo.createdAt
                              ? new Date(photo.createdAt).toLocaleDateString(
                                  "en-IN",
                                  {
                                    day: "2-digit",
                                    month: "short",
                                    year: "numeric",
                                  },
                                )
                              : "Saved photo"}
                          </span>

                          <button
                            type="button"
                            onClick={() => void handleDelete(photo)}
                            disabled={!id || deletingId === id}
                            className="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-bold text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
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
