import 'reflect-metadata'
import { NestFactory } from '@nestjs/core'
import { AppModule } from './app.module'
import { PrismaService } from './prisma/prisma.service'
import { loadEnv } from './config/env'

try { process.loadEnvFile() } catch { /* sem .env: usa o ambiente */ }

async function bootstrap() {
  const env = loadEnv()
  const app = await NestFactory.create(AppModule)
  try {
    await app.get(PrismaService).ping()
  } catch (e) {
    throw new Error(`Banco inacessível em DATABASE_URL: ${(e as Error).message}`)
  }
  if (env.FRONT_ORIGIN) app.enableCors({ origin: env.FRONT_ORIGIN })
  await app.listen(env.PORT)
}

bootstrap().catch((e) => { console.error(e.message); process.exit(1) })
