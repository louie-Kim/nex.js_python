import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
   eslint: {
    // 🚨 빌드 시 ESLint 에러가 있어도 배포를 막지 않음
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
