import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { fontVariables } from "@/app/fonts";
import { Toaster } from "@/components/admin/Toaster";
import "../globals.css";

export const metadata: Metadata = {
  title: { default: "Admin panel", template: "%s · Admin" },
  robots: { index: false, follow: false },
};

// Without this the phone renders the panel at 980px and everything needs
// horizontal scrolling. (Each root layout needs its own viewport export.)
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#0b0c0f",
};

export default function AdminRootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="uz" className={`${fontVariables} admin-root`}>
      <body className="antialiased">
        <Toaster>{children}</Toaster>
      </body>
    </html>
  );
}
