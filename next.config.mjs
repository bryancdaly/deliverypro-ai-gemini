/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: true,
    outputFileTracingIncludes: {
        "/legacy/[...path]": ["./legacy/**/*"]
    }
};

export default nextConfig;
