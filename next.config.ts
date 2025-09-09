import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      // 允许从 https://image.mux.com/... 加载图片
      {
        protocol: 'https',
        hostname: 'image.mux.com'
      },
      // uploadthing 的图片
      {
        protocol: 'https',
        hostname: '9bs3dqprct.ufs.sh'
      }
    ]
  } 
};

export default nextConfig;
