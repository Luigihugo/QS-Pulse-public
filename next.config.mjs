/** @type {import('next').NextConfig} */
const nextConfig = {
  // Isola cache de desenvolvimento para evitar corrupção do bundle
  // quando o usuário alterna entre build/start e dev.
  distDir: process.env.NODE_ENV === "development" ? ".next-dev" : ".next",
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          // Impede que o site seja carregado em iframes de outros domínios (clickjacking)
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          // Impede o browser de "adivinhar" o tipo do arquivo (MIME sniffing)
          { key: "X-Content-Type-Options", value: "nosniff" },
          // Controla o que é enviado no Referer header — envia apenas a origem em cross-origin
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          // Desabilita features de browser que não são usadas
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=(), payment=()",
          },
          // HSTS — força HTTPS por 1 ano (apenas tem efeito em produção via HTTPS)
          {
            key: "Strict-Transport-Security",
            value: "max-age=31536000; includeSubDomains",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
