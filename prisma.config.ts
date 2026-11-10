import { defineConfig, env } from 'prisma/config'

try { process.loadEnvFile() } catch { /* sem .env: usa o ambiente */ }

export default defineConfig({
  schema: 'prisma/schema.prisma',
  datasource: { url: env('DIRECT_URL') },
})
