// Initial creation: Root layout - wraps app in AuthProvider, sets dark theme defaults, page metadata.
import type { Metadata, Viewport } from "next";
import "./globals.css";
import { AuthProvider } from "@/contexts/AuthContext";

export const metadata: Metadata = {
  title: "Studio — Wedding Photography & Videography",
  description: "Project management for wedding photography and videography teams.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#09090b",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full">
      <body className="min-h-full bg-zinc-950 text-zinc-100 antialiased">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
