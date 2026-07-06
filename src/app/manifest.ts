import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "My PRU Dash",
    short_name: "PRU Dash",
    description:
      "Personal client, pipeline and production dashboard for a PLUK financial consultant",
    start_url: "/",
    display: "standalone",
    background_color: "#fcfcfb",
    theme_color: "#af1e23",
    orientation: "portrait",
    icons: [
      {
        src: "/icons/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-512-maskable.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
