const backendUrl = process.env.CLIPFORGE_FASTAPI_URL ?? "http://127.0.0.1:8000";

/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    typedRoutes: false
  },
  async rewrites() {
    return {
      beforeFiles: [
        { source: "/api/upload", destination: `${backendUrl}/api/upload` },
        { source: "/api/process/:projectId", destination: `${backendUrl}/api/process/:projectId` },
        { source: "/api/status/:projectId", destination: `${backendUrl}/api/status/:projectId` },
        { source: "/api/clips/:projectId", destination: `${backendUrl}/api/clips/:projectId` },
        { source: "/api/download/:projectId/:clipId", destination: `${backendUrl}/api/download/:projectId/:clipId` },
      ],
    };
  },
};

export default nextConfig;
