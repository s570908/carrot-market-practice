/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: [
      "localhost",
      "imagedelivery.net",
      "videodelivery.net",
      "raw.githubusercontent.com",
      "api.thecatapi.com",
      "cdn2.thecatapi.com",
    ],
    loader: "imgix",
    path: "http://localhost:3000/uploads",
  },
  reactStrictMode: true,
};

module.exports = nextConfig;
