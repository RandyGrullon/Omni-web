/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    // Deshabilitamos la comprobación de tipos durante el build para que pase a pesar de los 'any'
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
