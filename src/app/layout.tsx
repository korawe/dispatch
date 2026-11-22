import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { bricolage, outfit } from "./fonts";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Dispatch",
  description: "Turn a quick voice note into clear delegation emails.",
  appleWebApp: {
    capable: true,
    title: "Dispatch",
    statusBarStyle: "default",
  },
};

export const viewport: Viewport = {
  // Matches the Pulse page background, so browser and window bars blend in.
  themeColor: "#F3F5FF",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en-GB"
      className={`${geistSans.variable} ${geistMono.variable} ${bricolage.variable} ${outfit.variable} h-full antialiased`}
    >
      {/* "pulse" applies the chosen look to every page (spec decision 31; see globals.css). */}
      <body className="pulse min-h-full flex flex-col">{children}</body>
    </html>
  );
}
