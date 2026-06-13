import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "PagePulse — Facebook Page Insights",
    short_name: "PagePulse",
    description:
      "Daily insights and history for the Facebook Pages you administer.",
    start_url: "/",
    display: "standalone",
    background_color: "#0b0f17",
    theme_color: "#0b0f17",
    orientation: "portrait",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      {
        src: "/icon-maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
