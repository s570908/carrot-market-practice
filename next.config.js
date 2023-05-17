/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: [
      "imagedelivery.net",
      "videodelivery.net",
      "raw.githubusercontent.com",
      "api.thecatapi.com",
      "cdn2.thecatapi.com",
    ],
  },
};

module.exports = nextConfig;
