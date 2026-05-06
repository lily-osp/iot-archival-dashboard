import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "IoT Archival Dashboard",
  description: "Swiss Archival IoT Monitoring System",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Archive",
  },
  formatDetection: {
    telephone: false,
  },
};

export const viewport = {
  themeColor: "#8B1A1A",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
