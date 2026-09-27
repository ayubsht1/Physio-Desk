import type { NextConfig } from "next";

const backendUrl =
  process.env.BACKEND_API_URL || "http://127.0.0.1:8000/api/v1";

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