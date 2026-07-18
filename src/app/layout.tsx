// src/app/layout.tsx
import type { Metadata, Viewport } from "next";
import "./globals.css";
import { ClerkProvider } from "@clerk/nextjs";
import { BottomNav } from "@/components/bottom-nav";

export const metadata: Metadata = {
  title: "Excel CES",
  description: "Excel Roofing — Cost Estimating System",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Excel CES",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#1E2A4A",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body className="font-sans">
          <main className="min-h-screen pb-20 md:pb-0 md:pl-64">
            {children}
          </main>
          <BottomNav />
        </body>
      </html>
    </ClerkProvider>
  );
}
