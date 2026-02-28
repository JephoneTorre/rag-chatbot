/** @type {import('next').NextConfig} */
const nextConfig = {
  serverExternalPackages: ["fs", "path"],
  turbopack: {
    root: '.',
  },
};

export default nextConfig;