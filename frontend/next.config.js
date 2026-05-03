/** @type {import('next').NextConfig} */
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
}
module.exports = nextConfig
