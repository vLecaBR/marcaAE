import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Essa é a trava de segurança!
  // Diz pro Turbopack: "Não tente empacotar ou otimizar o Prisma para Edge. Deixe ele rodar nativo no Node.js"
  serverExternalPackages: ["@prisma/client"],
};

export default nextConfig;