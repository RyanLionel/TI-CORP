import { Controller, Get, ServiceUnavailableException } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'

@Controller('health')
export class HealthController {
  constructor(private readonly db: PrismaService) {}

  @Get()
  async check() {
    try {
      await this.db.ping()
      return { status: 'ok', database: 'up' }
    } catch {
      throw new ServiceUnavailableException({ status: 'error', database: 'down' })
    }
  }
}
