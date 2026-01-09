import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  
  // Redireciona do domínio antigo para o novo
  async redirects() {
    return [
      // Caso alguém acesse pelo domínio antigo, redireciona automaticamente
      {
        source: '/:path*',
        has: [
          {
            type: 'host',
            value: 'franca-flow.vercel.app',
          },
        ],
        destination: 'https://flow.francaassessoria.com/:path*',
        permanent: true, // Redirect 301 (permanente)
      },
    ];
  },
};

export default nextConfig;
