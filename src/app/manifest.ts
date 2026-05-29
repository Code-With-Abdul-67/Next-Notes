import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "NEXT Notes",
    short_name: "GlassNotes",
    description: "A beautiful, secure, glassmorphism-themed Notes Application",
    start_url: "/",
    display: "standalone",
    background_color: "#040209",
    theme_color: "#8B5CF6",
    orientation: "portrait-primary",
    icons: [
      {
        src: "/icons/icon.svg",
        sizes: "192x192",
        type: "image/svg+xml",
        purpose: "any",
      },
      {
        src: "/icons/icon.svg",
        sizes: "512x512",
        type: "image/svg+xml",
        purpose: "any",
      },
    ],
  };
}
