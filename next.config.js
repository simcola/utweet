/** @type {import('next').NextConfig} */
const nextConfig = {
  // Allow larger request bodies (fixes 413 on uploads; AWS may still impose platform limits)
  experimental: {
    serverActions: {
      bodySizeLimit: '10mb',
    },
  },
  webpack(config) {
    config.resolve.alias['@'] = __dirname;  // Maps @/ to project root
    // Alternative more explicit version:
    // config.resolve.alias['@/*'] = path.resolve(__dirname, './*');
    return config;
  },
  // Ensure environment variables are available to server-side code
  // Note: NODE_ENV is automatically set by Next.js and cannot be in env config
  env: {
    DATABASE_URL: process.env.DATABASE_URL,
    NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET,
    NEXTAUTH_URL: process.env.NEXTAUTH_URL,
  },
};

module.exports = nextConfig;

