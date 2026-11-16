import { Module } from '@nestjs/common'
import { HealthController } from './health/health.controller'
import { PrismaService } from './prisma/prisma.service'
import { SupabaseAuthGuard } from './auth/supabase-auth.guard'
import { LoansController } from './loans/loans.controller'
import { LoansService } from './loans/loans.service'
import { EquipmentsController } from './equipments/equipments.controller'
import { EquipmentsService } from './equipments/equipments.service'

@Module({
  controllers: [HealthController, LoansController, EquipmentsController],
  providers: [PrismaService, SupabaseAuthGuard, LoansService, EquipmentsService],
})
export class AppModule {}
