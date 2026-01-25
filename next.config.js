/** @type {import('next').NextConfig} */
const nextConfig = {
  // Your other config here if any...
  webpack(config) {
    config.resolve.alias['@'] = __dirname;  // Maps @/ to project root
    // Alternative more explicit version:
    // config.resolve.alias['@/*'] = path.resolve(__dirname, './*');
    return config;
  },
};

module.exports = nextConfig;

