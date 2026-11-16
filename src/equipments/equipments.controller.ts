import { Controller, Get, UseGuards } from '@nestjs/common'
import { SupabaseAuthGuard } from '../auth/supabase-auth.guard'
import { EquipmentsService } from './equipments.service'

@Controller('equipments')
@UseGuards(SupabaseAuthGuard)
export class EquipmentsController {
  constructor(private readonly equipments: EquipmentsService) {}

  @Get()
  list() {
    return this.equipments.list()
  }
}
