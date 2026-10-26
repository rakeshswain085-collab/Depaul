
"use client";

import { useEffect, useState } from "react";

type ImageLightboxProps = {
  src: string;
  alt: string;
  children: React.ReactNode;
};

export function ImageLightbox({
  src,
  alt,
  children,
}: ImageLightboxProps) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;

    const previousOverflow = document.body.style.overflow;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={`View full-size photo: ${alt}`}
        className="group absolute inset-0 z-20 h-full w-full cursor-zoom-in rounded-full focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-amber-400"
      >
        {children}

        <span className="absolute inset-0 flex items-center justify-center rounded-full bg-black/0 text-white opacity-0 transition-all duration-300 group-hover:bg-black/30 group-hover:opacity-100">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            className="h-7 w-7"
            aria-hidden="true"
          >
            <circle cx="11" cy="11" r="7" />
            <path d="m16 16 4 4M11 8v6M8 11h6" />
          </svg>
        </span>
      </button>

      {open && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={`Full-size photo: ${alt}`}
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/90 p-4 backdrop-blur-sm sm:p-8"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setOpen(false);
            }
          }}
        >
          <button
            type="button"
            onClick={() => setOpen(false)}
            aria-label="Close image"
            className="absolute right-4 top-4 z-30 flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-3xl text-white transition hover:bg-white/20"
          >
            &times;
          </button>

          <img
            src={src}
            alt={alt}
            className="max-h-[85vh] max-w-full rounded-lg object-contain"
          />

          <p className="absolute bottom-3 left-4 right-4 text-center text-sm text-white/80">
            {alt}
          </p>
        </div>
      )}
    </>
  );
}
