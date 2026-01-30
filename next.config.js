/** @type {import('next').NextConfig} */
const nextConfig = {
  // Your other config here if any...
  webpack(config) {
    config.resolve.alias['@'] = __dirname;  // Maps @/ to project root
    // Alternative more explicit version:
    // config.resolve.alias['@/*'] = path.resolve(__dirname, './*');
    return config;
  },
  // Ensure environment variables are available to server-side code
  env: {
    DATABASE_URL: process.env.DATABASE_URL,
    NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET,
    NEXTAUTH_URL: process.env.NEXTAUTH_URL,
    NODE_ENV: process.env.NODE_ENV,
  },
};

module.exports = nextConfig;

