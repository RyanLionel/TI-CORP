import { ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common'
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

// Spec 005: recusas da função public.return_loan (schema inicial) e o status HTTP de cada uma.
const RETURN_REFUSALS: [string, (m: string) => Error][] = [
  ['Empréstimo não encontrado', (m) => new NotFoundException(m)],
  ['Empréstimo já devolvido', (m) => new ConflictException(m)],
  ['Sem permissão para registrar esta devolução', (m) => new ForbiddenException(m)],
]

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

  async giveBack(userId: string, loanId: string) {
    // Regra 2: só quem pegou devolve por esta rota. A função return_loan também aceita Operações
    // (devolução no balcão, fora de escopo), então o dono é conferido aqui, antes de chamar o banco.
    const [dono] = await this.db.$queryRaw<{ borrower_id: string }[]>`
      select borrower_id from public.loans where id = ${loanId}::uuid`
    if (!dono) throw new NotFoundException('Empréstimo não encontrado')
    if (dono.borrower_id !== userId) throw new ForbiddenException('Sem permissão para registrar esta devolução')
    try {
      const [loan] = await this.db.asUser(userId, (tx) =>
        tx.$queryRaw<{ id: string; returned_at: Date }[]>`select id, returned_at from public.return_loan(${loanId}::uuid)`,
      )
      return { id: loan.id, returnedAt: new Date(loan.returned_at).toISOString() }
    } catch (e) {
      const text = errorText(e)
      const found = RETURN_REFUSALS.find(([m]) => text.includes(m))
      if (found) throw found[1](found[0])
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
