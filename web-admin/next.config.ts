/** @type {import('next').NextConfig} */
const nextConfig = {
  // Configuración para permitir acceso desde tu IP local (iPhone/TV)
  allowedDevOrigins: ["192.168.1.13", "localhost:3000"]
};

export default nextConfig;
