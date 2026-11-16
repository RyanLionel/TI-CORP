import { ConflictException, Injectable } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'

// Mensagens que o banco devolve nas recusas de regra (migration regras_solicitar_emprestimo). Viram 409.
const RULE_MESSAGES = [
  'Equipamento em manutenção',
  'Equipamento já emprestado',
  'Limite de 5 empréstimos em aberto atingido',
  'Você tem empréstimo em atraso',
  'Equipamento não encontrado',
]

function errorText(e: unknown, depth = 0): string {
  if (!e || depth > 4) return ''
  if (typeof e !== 'object') return String(e)
  const o = e as { message?: unknown; meta?: unknown; cause?: unknown }
  let meta = ''
  try {
    meta = JSON.stringify(o.meta ?? '')
  } catch {
    /* meta não serializável */
  }
  return `${String(o.message ?? '')} ${meta} ${errorText(o.cause, depth + 1)}`
}

export function ruleRefusal(e: unknown): string | null {
  const text = errorText(e)
  const found = RULE_MESSAGES.find((m) => text.includes(m))
  if (found) return found
  // Corrida entre dois pedidos: o índice único barra o segundo (decisão da spec 001, CA-07).
  if (/23505|loans_one_open_per_equipment/.test(text)) return 'Equipamento já emprestado'
  return null
}

type LoanRow = { id: string; equipment_id: string; due_at: Date }
type MyLoanRow = LoanRow & { atrasado: boolean }

@Injectable()
export class LoansService {
  constructor(private readonly db: PrismaService) {}

  async request(userId: string, equipmentId: string) {
    try {
      const [loan] = await this.db.asUser(userId, (tx) =>
        tx.$queryRaw<LoanRow[]>`select id, equipment_id, due_at from public.request_loan(${equipmentId}::uuid)`,
      )
      return { id: loan.id, equipmentId: loan.equipment_id, dueAt: new Date(loan.due_at).toISOString() }
    } catch (e) {
      const motivo = ruleRefusal(e)
      if (motivo) throw new ConflictException(motivo)
      throw e
    }
  }

  async mine(userId: string) {
    const rows = await this.db.asUser(userId, (tx) =>
      tx.$queryRaw<MyLoanRow[]>`
        select id, equipment_id, due_at, (due_at < now()) as atrasado
        from public.loans
        where returned_at is null and borrower_id = ${userId}::uuid
        order by due_at`,
    )
    return rows.map((r) => ({
      id: r.id,
      equipmentId: r.equipment_id,
      dueAt: new Date(r.due_at).toISOString(),
      atrasado: r.atrasado,
    }))
  }
}
