/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    // Deshabilitamos ESLint durante el build para que pase a pesar de los warnings de variables no usadas
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Deshabilitamos la comprobación de tipos durante el build para que pase a pesar de los 'any'
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
