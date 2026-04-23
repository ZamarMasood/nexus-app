/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ['@react-pdf/renderer'],
    optimizePackageImports: [
      'lucide-react',
      '@supabase/supabase-js',
      // @radix-ui/* entries removed — Next.js' experimental package
      // optimization has caused ref-composition loops in Radix Dialog /
      // Presence when combined with dev Fast Refresh. The infinite
      // setNode/setRef update cycle we saw was triggered by this.
    ],
    // staleTimes removed — it caused stale data after mutations (e.g. task
    // board drag-and-drop) because the client-side router served cached pages
    // for 30s, ignoring server revalidation.
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
};

export default nextConfig;
