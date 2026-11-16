import { BadRequestException, Body, Controller, Get, HttpCode, Post, UseGuards } from '@nestjs/common'
import { z } from 'zod'
import { SupabaseAuthGuard, type AuthUser } from '../auth/supabase-auth.guard'
import { CurrentUser } from '../auth/current-user.decorator'
import { LoansService } from './loans.service'

const requestSchema = z.object({ equipmentId: z.string().uuid() })

@Controller('loans')
@UseGuards(SupabaseAuthGuard)
export class LoansController {
  constructor(private readonly loans: LoansService) {}

  @Post()
  @HttpCode(201)
  create(@Body() body: unknown, @CurrentUser() user: AuthUser) {
    const parsed = requestSchema.safeParse(body)
    if (!parsed.success) throw new BadRequestException('equipmentId deve ser um UUID')
    return this.loans.request(user.id, parsed.data.equipmentId)
  }

  @Get('me')
  mine(@CurrentUser() user: AuthUser) {
    return this.loans.mine(user.id)
  }
}
