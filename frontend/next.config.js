/** @type {import('next').NextConfig} */
const FaroSourceMapUploaderPlugin = require('@grafana/faro-webpack-plugin');

const nextConfig = {
    allowedDevOrigins: ['192.168.0.101'],

    async rewrites() {
        const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
        // Ensure backendUrl doesn't have a trailing slash for consistent concatenation
        const normalizedBackendUrl = backendUrl.replace(/\/$/, '');

        return [
            {
                source: '/api/:path*',
                destination: `${normalizedBackendUrl}/api/:path*`,
            },
        ]
    },

    webpack: (config, { isServer, dev }) => {
        // Only run plugin in production build
        if (!dev) {
            config.plugins.push(
                new FaroSourceMapUploaderPlugin({
                    appName: process.env.NEXT_PUBLIC_GRAFANA_APP_NAME,
                    endpoint: process.env.NEXT_PUBLIC_GRAFANA_END_POINT,
                    appId: process.env.NEXT_PUBLIC_GRAFANA_APP_ID,
                    stackId: process.env.NEXT_PUBLIC_GRAFANA_STACK_ID,
                    verbose: true,
                    apiKey: process.env.NEXT_PUBLIC_GRAFANA_API_KEY,
                    gzipContents: true,
                })
            );
        }
        return config;
    },
}
module.exports = nextConfig
