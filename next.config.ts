import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        hostname: "dunb17ur4ymx4.cloudfront.net",
      },
      {
        hostname: "cdn.discordapp.com",
      },
      {
        protocol: "https",
        hostname: "proxy.dokku.co.kr",
        port: "",
        pathname: "/screenshot/**",
      },
      {
        protocol: "https",
        hostname: "screenshot.dokku.co.kr",
      },
      {
        protocol: "https",
        hostname: "proxy.dokku.co.kr",
      },
    ],
  },
};

export default nextConfig;
