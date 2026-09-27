import type { NextConfig } from "next";

const backendUrl = process.env.BACKEND_API_URL;

if (!backendUrl) {
  throw new Error("BACKEND_API_URL is not set");
}

const nextConfig: NextConfig = {
  output: "standalone",

  async rewrites() {
    return [
      {
        source: "/api/v1/:path*",
        destination: `${backendUrl}/:path*`,
      },
    ];
  },
};

export default nextConfig;