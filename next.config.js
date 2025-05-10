/** @type {import('next').NextConfig} */

const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  images: {
    domains: [
      "imagedelivery.net",
      "videodelivery.net",
      "raw.githubusercontent.com",
      "www.gravatar.com",
      "iframe.videodelivery.net",
      "picsum.photos",
      "via.placeholder.com",
      "pixabay.com",
      "images.unsplash.com",
    ],
  },
  // fastRefresh: false,
  webpack(config) {
    config.module.rules.push({
      test: /\.svg$/,
      issuer: { and: [/\.(js|ts)x?$/] },
      use: [
        {
          loader: "@svgr/webpack",
          options: {
            icon: true,
          },
        },
      ],
    });
    return config;
  },
  // PWA 관련 헤더 추가
  async headers() {
    return [
      {
        source: "/manifest.json",
        headers: [
          {
            key: "Content-Type",
            value: "application/manifest+json",
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
