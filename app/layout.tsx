import type { Metadata } from "next";
import "./globals.css";

// Deliberately not using next/font/google here: it requires a build-time
// fetch to fonts.googleapis.com, which fails the build on a network with
// no (or restricted) internet access — not a hypothetical, it failed in
// this project's own CI sandbox. Tailwind's default font-sans stack (system
// UI fonts) needs no network access and is a perfectly good look for
// internal business software.

export const metadata: Metadata = {
  title: "TrainerPay",
  description: "HR, class allocation and fortnightly payroll for Jazz Music Institute.",
};

// Deliberately typed by hand rather than with Next.js's generated
// `LayoutProps<"/">` helper: that type only exists after `next dev`/`build`
// has run once and written `.next/types/`, which makes `tsc --noEmit`
// fail on a fresh checkout before anyone has run the app. A plain
// `{ children: React.ReactNode }` needs no generated types and works the
// same way for the root layout.
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col font-sans">{children}</body>
    </html>
  );
}
