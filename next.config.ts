import type { NextConfig } from "next";

const nextConfig: NextConfig = {
    images: {
          formats: ["image/avif", "image/webp"],
    },
    async rewrites() {
          return [
            {
                      source: "/iclock/:path*",
                      destination:
                                  "https://zqlixzklxrqewxvqhfzc.supabase.co/functions/v1/iclock/:path*",
            },
                ];
    },
};

export default nextConfig;
