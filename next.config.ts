import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  api: {
    bodyParser: {
      sizeLimit: '200mb',
    },
  },
};

export default nextConfig;
