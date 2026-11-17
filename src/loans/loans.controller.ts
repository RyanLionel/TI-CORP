import { BadRequestException, Body, Controller, Get, HttpCode, Param, Post, UseGuards } from '@nestjs/common'
import { z } from 'zod'
import { SupabaseAuthGuard, type AuthUser } from '../auth/supabase-auth.guard'
import { CurrentUser } from '../auth/current-user.decorator'
import { LoansService } from './loans.service'

const requestSchema = z.object({ equipmentId: z.string().uuid() })
const idSchema = z.string().uuid()

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

  // Spec 005 · devolver o próprio empréstimo (CA-01 a CA-07)
  @Post(':id/return')
  @HttpCode(200)
  giveBack(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    if (!idSchema.safeParse(id).success) throw new BadRequestException('id deve ser um UUID')
    return this.loans.giveBack(user.id, id)
  }

  @Get('me')
  mine(@CurrentUser() user: AuthUser) {
    return this.loans.mine(user.id)
  }
}
