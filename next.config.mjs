import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

const backendUrl =
  process.env.API_BASE_URL || process.env.NEXT_PUBLIC_API_URL || "http://192.168.77.30:6040";

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  typedRoutes: true,
  cacheComponents: true,
  images: {
    remotePatterns: [],
  },
  async rewrites() {
    return [
      {
        source: "/ticketHub/:path*",
        destination: `${backendUrl}/ticketHub/:path*`,
      },
      {
        source: "/ticket/hub/:path*",
        destination: `${backendUrl}/ticket/hub/:path*`,
      },
      {
        source: "/ticketHub",
        destination: `${backendUrl}/ticketHub`,
      },
      {
        source: "/ticket/hub",
        destination: `${backendUrl}/ticket/hub`,
      },
      {
        source: "/ticketAttachments/:path*",
        destination: `${backendUrl}/ticketAttachments/:path*`,
      },
    ];
  },
};

export default withNextIntl(nextConfig);
