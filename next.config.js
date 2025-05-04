/** @type {import('next').NextConfig} */
const nextConfig = {
  poweredByHeader: false,
  reactStrictMode: true,
  // swcMinify is enabled by default in Next.js 13+ and this option is deprecated
  webpack: (config, { isServer }) => {
    // 优化 webpack 配置
    config.optimization = {
      ...config.optimization,
      moduleIds: 'deterministic',
      chunkIds: 'deterministic'
    }
    return config
  }
}

module.exports = nextConfig
  