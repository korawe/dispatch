import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Dispatch",
    short_name: "Dispatch",
    description: "Turn a quick voice note into clear delegation emails.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    // Pulse page background (spec decision 31).
    background_color: "#F3F5FF",
    theme_color: "#F3F5FF",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
