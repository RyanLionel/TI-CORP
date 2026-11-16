import { Injectable } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'

type EquipmentRow = { id: string; nome: string; categoria: string; patrimonio: string | null; situacao: string }

@Injectable()
export class EquipmentsService {
  constructor(private readonly db: PrismaService) {}

  // A situação é calculada no servidor: a RLS não deixa o colaborador ver empréstimo alheio (plan.md da spec 001, item 3).
  // Só o booleano "tem empréstimo em aberto" sai daqui; nenhum dado de empréstimo de outra pessoa é exposto.
  async list() {
    const rows = await this.db.$queryRaw<EquipmentRow[]>`
      select e.id, e.nome, e.categoria::text as categoria, e.patrimonio,
        case
          when e.condition = 'manutencao' then 'manutencao'
          when exists (select 1 from public.loans l where l.equipment_id = e.id and l.returned_at is null) then 'emprestado'
          else 'disponivel'
        end as situacao
      from public.equipments e
      order by e.patrimonio nulls last, e.nome`
    // imagem: null até a spec 002 criar as colunas de imagem (contrato: "ou null").
    return rows.map((r) => ({ ...r, imagem: null }))
  }
}
