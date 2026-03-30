import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },

  // ── Image optimization ─────────────────────────────────────────────────────
  images: {
    formats: ["image/avif", "image/webp"],
    minimumCacheTTL: 60 * 60 * 24 * 30, // 30 days
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    remotePatterns: [
      // Allow any Convex storage CDN URLs
      { protocol: "https", hostname: "**.convex.cloud" },
      // Allow S3-hosted user media if applicable
      { protocol: "https", hostname: "**.amazonaws.com" },
    ],
  },

  // ── Compiler optimizations ─────────────────────────────────────────────────
  compiler: {
    // Remove console.log in production (keep console.error/warn)
    removeConsole: process.env.NODE_ENV === "production"
      ? { exclude: ["error", "warn"] }
      : false,
  },

  // ── Performance headers ────────────────────────────────────────────────────
  async headers() {
    return [
      {
        // Aggressive caching for fonts and static assets
        source: "/:path(playfair-800\\.woff2|icon-192\\.png|icon-512\\.png|manifest\\.json)",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
      {
        // Cache OG image
        source: "/og-image.png",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=86400, stale-while-revalidate=3600",
          },
        ],
      },
    ];
  },

  // ── Experimental ──────────────────────────────────────────────────────────
  experimental: {
    // Optimize package imports for lucide-react (large icon library)
    optimizePackageImports: ["lucide-react"],
  },
};

export default nextConfig;
