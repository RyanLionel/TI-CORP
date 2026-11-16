import { Injectable, OnModuleDestroy } from '@nestjs/common'
import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient, Prisma } from '../generated/prisma/client'
import { loadEnv } from '../config/env'

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleDestroy {
  constructor() {
    super({ adapter: new PrismaPg({ connectionString: loadEnv().DATABASE_URL, connectionTimeoutMillis: 3000 }) })
  }

  async ping(): Promise<void> {
    await this.$queryRaw`select 1`
  }

  // Executa como o usuário logado: papel `authenticated` + claims na transação, então a RLS vale (ADR-001).
  async asUser<T>(userId: string, fn: (tx: Prisma.TransactionClient) => Promise<T>): Promise<T> {
    const claims = JSON.stringify({ sub: userId, role: 'authenticated' })
    return this.$transaction(async (tx) => {
      await tx.$executeRawUnsafe('set local role authenticated')
      await tx.$executeRaw`select set_config('request.jwt.claims', ${claims}, true)`
      return fn(tx)
    })
  }

  async onModuleDestroy() {
    await this.$disconnect()
  }
}
