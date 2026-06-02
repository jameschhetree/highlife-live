import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
    ],
  },
  async redirects() {
    return [
      {
        source: "/find-an-agent",
        destination: "/findanagent",
        permanent: true,
      },
      {
        source: "/find-an-artist",
        destination: "/findanartist",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
