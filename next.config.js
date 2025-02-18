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
      "picsum.photos",
      "via.placeholder.com",
      "pixabay.com",
      "images.unsplash.com",
    ],
  },
  // fastRefresh: false,
};

module.exports = nextConfig;
