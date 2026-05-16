import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'standalone',
  serverExternalPackages: ['node-ical'],
  outputFileTracingIncludes: {
    // node-ical dynamically requires temporal-polyfill and rrule-temporal —
    // force-include them so standalone output ships their files.
    '/*': [
      './node_modules/node-ical/**/*',
      './node_modules/temporal-polyfill/**/*',
      './node_modules/rrule-temporal/**/*',
    ],
  },
};

export default nextConfig;
