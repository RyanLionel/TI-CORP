import { Injectable, OnModuleDestroy } from '@nestjs/common'
import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '../generated/prisma/client'
import { loadEnv } from '../config/env'

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleDestroy {
  constructor() {
    super({ adapter: new PrismaPg({ connectionString: loadEnv().DATABASE_URL, connectionTimeoutMillis: 3000 }) })
  }

  async ping(): Promise<void> {
    await this.$queryRaw`select 1`
  }

  async onModuleDestroy() {
    await this.$disconnect()
  }
}
