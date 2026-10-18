import type { NextConfig } from 'next';
import path from 'path';
import { fileURLToPath } from 'url';

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
      {
        protocol: 'http',
        hostname: '**',
      },
    ],
  },
  // Исключаем серверные пакеты из клиентского bundle
  serverExternalPackages: [
    'fs',
    'path',
    'cloudinary',
    'bcryptjs',
    'jsonwebtoken',
    'mongoose',
    'multer',
    'nodemailer',
  ],
  // Исключаем серверную директорию из компиляции Next.js
  // Turbopack конфигурация для игнорирования server/
  // Используем правильный синтаксис: rules должен быть объектом
  turbopack: {
    rules: {
      // Исключаем все файлы из server директории из компиляции
      // Используем пустой массив loaders для полного игнорирования
      'server/**': {
        loaders: [],
      },
      '**/server/**': {
        loaders: [],
      },
    },
  },
  // Исключаем серверную директорию из компиляции (для webpack fallback)
  webpack: (config, { isServer, webpack }) => {
    // Исключаем server директорию из watch и компиляции
    // Get directory name for ES modules compatibility
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);

    config.watchOptions = {
      ...config.watchOptions,
      ignored: [
        '**/node_modules/**',
        '**/server/**',
        '**/.next/**',
        '**/server',
        'server/**',
        path.resolve(__dirname, 'server'),
      ],
    };

    // Игнорируем server директорию при резолве модулей
    config.plugins = [
      ...config.plugins,
      new webpack.IgnorePlugin({
        resourceRegExp: /^\.\/server\/|^server\/|^\.\.\/server\//,
      }),
    ];

    if (!isServer) {
      // Для клиентского bundle исключаем серверные модули
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        path: false,
        net: false,
        tls: false,
        crypto: false,
      };
    }
    return config;
  },
  async rewrites() {
    // Proxy API calls through Next.js domain.
    //
    // WHY:
    // - In production (Vercel frontend + Render backend) third-party cookies are often blocked.
    // - If the browser calls backend directly, httpOnly auth cookies may not be stored/sent.
    // - With a same-origin /api proxy, cookies become FIRST-PARTY on the frontend domain.
    //
    // Dev -> local backend
    // Prod -> Render backend (NEXT_PUBLIC_API_URL)
    const prodApiBase = (process.env.NEXT_PUBLIC_API_URL || '').trim().replace(/\/+$/, '');
    const prodDestination = prodApiBase ? `${prodApiBase}/api/:path*` : '';

    return [
      {
        source: '/api/:path*',
        destination:
          process.env.NODE_ENV === 'development'
            ? 'http://localhost:8000/api/:path*'
            : prodDestination || 'http://localhost:8000/api/:path*',
      },
    ];
  },
};

export default nextConfig;
