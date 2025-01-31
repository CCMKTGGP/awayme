/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    return [
      {
        source: "/.well-known/microsoft-identity-association.json",
        destination: "/api/microsoft-identity-association",
      },
    ];
  },
};

export default nextConfig;
