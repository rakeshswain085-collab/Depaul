"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import {
  DEFAULT_SITE_IMAGES,
  type SiteImageKey,
} from "@/lib/site-images";

const SiteImagesContext =
  createContext<Record<SiteImageKey, string>>(DEFAULT_SITE_IMAGES);

export function SiteImageProvider({ children }: { children: ReactNode }) {
  const [images, setImages] = useState(DEFAULT_SITE_IMAGES);

  useEffect(() => {
    const controller = new AbortController();

    async function loadImages() {
      try {
        const response = await fetch("/api/site-images", {
          cache: "no-store",
          signal: controller.signal,
        });
        if (!response.ok) throw new Error("Unable to load website images.");

        const result = (await response.json()) as {
          success?: boolean;
          images?: Partial<Record<SiteImageKey, string>>;
        };
        if (!result.success || !result.images) {
          throw new Error("Website images response is invalid.");
        }
        setImages({ ...DEFAULT_SITE_IMAGES, ...result.images });
      } catch (error) {
        if (error instanceof Error && error.name === "AbortError") return;
      }
    }

    void loadImages();
    return () => controller.abort();
  }, []);

  return (
    <SiteImagesContext.Provider value={images}>
      {children}
    </SiteImagesContext.Provider>
  );
}

export function SiteImage({
  slot,
  src,
  alt,
  className,
  fill = false,
  priority = false,
  onError,
}: {
  slot: SiteImageKey;
  src?: string;
  alt: string;
  className?: string;
  fill?: boolean;
  priority?: boolean;
  onError?: () => void;
}) {
  const images = useContext(SiteImagesContext);
  const imageClass = fill
    ? `absolute inset-0 h-full w-full ${className ?? ""}`
    : className;

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={images[slot] || src || DEFAULT_SITE_IMAGES[slot]}
      alt={alt}
      className={imageClass}
      loading={priority ? "eager" : "lazy"}
      fetchPriority={priority ? "high" : "auto"}
      decoding="async"
      onError={onError}
    />
  );
}
