"use client";

import { useEffect, useState } from "react";
import {
  DEFAULT_SITE_IMAGES,
  SITE_IMAGE_SLOTS,
  type SiteImageKey,
} from "@/lib/site-images";

export default function WebsiteImagesPage() {
  const [images, setImages] = useState(DEFAULT_SITE_IMAGES);
  const [loading, setLoading] = useState(true);
  const [uploadingSlot, setUploadingSlot] = useState<SiteImageKey | null>(null);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    const controller = new AbortController();

    async function loadImages() {
      try {
        const response = await fetch("/api/site-images", {
          cache: "no-store",
          signal: controller.signal,
        });
        const result = (await response.json()) as {
          success?: boolean;
          images?: Partial<Record<SiteImageKey, string>>;
          warning?: string;
          message?: string;
        };
        if (!response.ok || !result.success || !result.images) {
          throw new Error(result.message || "Unable to load website images.");
        }
        setImages({ ...DEFAULT_SITE_IMAGES, ...result.images });
        setError(result.warning ?? "");
      } catch (cause) {
        if (cause instanceof Error && cause.name === "AbortError") return;
        setError(
          cause instanceof Error
            ? cause.message
            : "Unable to load website images.",
        );
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }

    void loadImages();
    return () => controller.abort();
  }, []);

  async function uploadImage(slot: SiteImageKey, file?: File) {
    if (!file) return;
    setUploadingSlot(slot);
    setError("");
    setMessage("");

    try {
      const formData = new FormData();
      formData.set("slot", slot);
      formData.set("file", file);

      const response = await fetch("/api/admin/site-images", {
        method: "POST",
        body: formData,
      });
      const result = await response.json();
      if (!response.ok || !result.success) {
        throw new Error(result.message || "Unable to update website image.");
      }

      setImages((current) => ({
        ...current,
        [slot]: `${result.imageUrl}?updated=${Date.now()}`,
      }));
      const originalSize = Number(result.originalSize);
      const optimizedSize = Number(result.optimizedSize);
      setMessage(
        `${SITE_IMAGE_SLOTS.find((item) => item.key === slot)?.label} updated. ` +
          `${(originalSize / 1024).toFixed(0)} KB → ${(optimizedSize / 1024).toFixed(0)} KB.`,
      );
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Unable to update website image.",
      );
    } finally {
      setUploadingSlot(null);
    }
  }

  return (
    <main className="mx-auto max-w-6xl space-y-7">
      <header>
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-amber-600">
          School administration
        </p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-900">
          Website Images
        </h1>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
          Replace the logo, campus photos, leadership portraits, and other
          featured images used across the public website. Uploaded images are
          automatically resized and optimized.
        </p>
      </header>

      {error && (
        <p
          role="alert"
          className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800"
        >
          {error}
        </p>
      )}
      {message && (
        <p
          role="status"
          className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800"
        >
          {message}
        </p>
      )}

      {loading ? (
        <p className="py-12 text-center text-sm text-slate-500">
          Loading website images…
        </p>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {SITE_IMAGE_SLOTS.map((slot) => (
            <article
              key={slot.key}
              className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
            >
              <div className="flex h-48 items-center justify-center bg-slate-100 p-4">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={images[slot.key]}
                  alt={`Current ${slot.label.toLowerCase()}`}
                  className="max-h-full max-w-full object-contain"
                />
              </div>
              <div className="space-y-3 p-5">
                <div>
                  <h2 className="font-bold text-slate-900">{slot.label}</h2>
                  <p className="mt-1 text-sm leading-5 text-slate-600">
                    {slot.description}
                  </p>
                </div>
                <label className="block text-sm font-semibold text-slate-700">
                  Replace image
                  <input
                    type="file"
                    accept="image/*"
                    disabled={uploadingSlot !== null}
                    onChange={(event) => {
                      void uploadImage(slot.key, event.currentTarget.files?.[0]);
                      event.currentTarget.value = "";
                    }}
                    className="mt-2 block w-full text-xs file:mr-3 file:rounded-lg file:border-0 file:bg-slate-900 file:px-3 file:py-2 file:font-semibold file:text-white"
                  />
                </label>
                <p className="text-xs text-slate-500">
                  {uploadingSlot === slot.key
                    ? "Uploading and optimizing…"
                    : "JPG, PNG, WebP, or other browser image formats · max 10 MB"}
                </p>
              </div>
            </article>
          ))}
        </div>
      )}
    </main>
  );
}
