import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // sharp is a native module — keep it out of the server bundle.
  serverExternalPackages: ["sharp"],
  poweredByHeader: false,
  experimental: {
    // Admin forms carry full block documents in three languages.
    serverActions: { bodySizeLimit: "4mb" },
  },
  images: {
    // Media is pre-optimised at upload time (see src/lib/media), so the
    // built-in optimiser is only used for YouTube thumbnails.
    remotePatterns: [{ protocol: "https", hostname: "i.ytimg.com" }],
  },
};

export default nextConfig;
