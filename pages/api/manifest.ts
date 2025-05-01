import { NextApiRequest, NextApiResponse } from "next";

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  res.setHeader("Content-Type", "application/json");
  res.setHeader("Cache-Control", "public, max-age=0, must-revalidate");

  const manifest = {
    name: "Carrot Market Practice",
    short_name: "CarrotMarket",
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#ff9900",
    orientation: "any",
    dir: "auto",
    lang: "ko-KR",
    description: "당신 근처의 중고 거래 마켓플레이스",
    categories: ["shopping", "social", "lifestyle"],
    scope: "/",
    id: "carrot-market",
    icons: [
      {
        src: "/icons/soy-bean-192-192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/icons/soy-bean-512-512.png",
        sizes: "512x512",
        type: "image/png",
      },
      {
        src: "/icons/soy-bean-192-192.png",
        sizes: "192x192",
        purpose: "maskable",
        type: "image/png",
      },
      {
        src: "/icons/soy-bean-512-512.png",
        sizes: "512x512",
        purpose: "maskable",
        type: "image/png",
      },
    ],
  };

  res.status(200).json(manifest);
}
