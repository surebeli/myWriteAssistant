import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Tauri 生产模式使用静态导出
  output: "export",
  // 禁用图片优化（静态导出不支持）
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
