/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: [
      "imagedelivery.net",
      "videodelivery.net",
      "raw.githubusercontent.com",
    ],
  },
};

module.exports = nextConfig;


