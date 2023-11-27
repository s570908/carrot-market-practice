/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: [
      "imagedelivery.net",
      "videodelivery.net",
      "raw.githubusercontent.com",
      "www.gravatar.com",
      "iframe.videodelivery.net",
    ],
  },
};

module.exports = nextConfig;
