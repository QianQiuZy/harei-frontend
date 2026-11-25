/** @type {import('next').NextConfig} */
const nextConfig = {
  allowedDevOrigins: ['127.0.0.1'],
  reactStrictMode: true,
  async headers() {
    return [
      {
        source: '/:section(account|personal|admin|music-admin|login)/:path*',
        headers: [
          { key: 'Content-Security-Policy', value: "frame-ancestors 'self'; base-uri 'self'; object-src 'none'" },
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' }
        ]
      },
      {
        source: '/api/:path*',
        headers: [
          { key: 'Content-Security-Policy', value: "sandbox; default-src 'none'" },
          { key: 'X-Content-Type-Options', value: 'nosniff' }
        ]
      }
    ];
  }
};

module.exports = nextConfig;
