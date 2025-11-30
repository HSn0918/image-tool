/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  // 禁用图片优化 API，因为静态导出不支持
  images: {
    unoptimized: true,
  },
};

module.exports = nextConfig;