import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default:
      "De-Paul Senior Secondary School, Aska | CBSE Affiliated | Affiliation No. 1530153",
    template: "%s | De-Paul Senior Secondary School, Aska",
  },
  description:
    "Official website of De-Paul Senior Secondary School, Aska, Ganjam, Odisha – CBSE affiliated (1530153). Notices, events, gallery, leadership messages, admissions and official school information.",
  keywords: [
    "De-Paul School Aska",
    "De-Paul Senior Secondary School",
    "CBSE school Aska",
    "Ganjam school",
    "Odisha CBSE school",
    "1530153",
  ],
  icons: { icon: "/favicon.svg" },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-slate-50 text-slate-900 antialiased">{children}</body>
    </html>
  );
}
