import { defineConfig } from 'prisma/config'

try { process.loadEnvFile() } catch { /* sem .env: usa o ambiente */ }

// ADR-003: `prisma generate` (postinstall, também no build da Vercel) não pode exigir variável de ambiente.
// Comandos que falam com o banco (`db pull`) usam DIRECT_URL; sem ela, falham ao conectar, com mensagem clara.
export default defineConfig({
  schema: 'prisma/schema.prisma',
  datasource: { url: process.env.DIRECT_URL ?? 'postgresql://defina-DIRECT_URL@localhost/sem-banco' },
})
