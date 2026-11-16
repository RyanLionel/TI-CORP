import { Injectable } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import { loadEnv } from '../config/env'

export const BUCKET_IMAGENS = 'equipamentos'

type EquipmentRow = {
  id: string
  nome: string
  categoria: string
  patrimonio: string | null
  situacao: string
  image_path: string | null
  image_photographer: string | null
  image_source_url: string | null
  image_license: string | null
}

export type Imagem = { url: string; fotografo: string; fonte: string; licenca: string } | null

// URL pública do objeto no bucket público do Supabase Storage (spec 002, regra 6).
export function urlPublica(supabaseUrl: string, path: string): string {
  return `${supabaseUrl.replace(/\/$/, '')}/storage/v1/object/public/${BUCKET_IMAGENS}/${path}`
}

@Injectable()
export class EquipmentsService {
  constructor(private readonly db: PrismaService) {}

  // A situação é calculada no servidor: a RLS não deixa o colaborador ver empréstimo alheio (plan.md da spec 001, item 3).
  // Só o booleano "tem empréstimo em aberto" sai daqui; nenhum dado de empréstimo de outra pessoa é exposto.
  async list() {
    const { SUPABASE_URL } = loadEnv()
    const rows = await this.db.$queryRaw<EquipmentRow[]>`
      select e.id, e.nome, e.categoria::text as categoria, e.patrimonio,
        case
          when e.condition = 'manutencao' then 'manutencao'
          when exists (select 1 from public.loans l where l.equipment_id = e.id and l.returned_at is null) then 'emprestado'
          else 'disponivel'
        end as situacao,
        e.image_path, e.image_photographer, e.image_source_url, e.image_license
      from public.equipments e
      order by e.patrimonio nulls last, e.nome`
    return rows.map(({ image_path, image_photographer, image_source_url, image_license, ...e }) => {
      // Contrato (spec 001): imagem = { url, fotografo, fonte, licenca } ou null.
      const imagem: Imagem =
        image_path && SUPABASE_URL
          ? {
              url: urlPublica(SUPABASE_URL, image_path),
              fotografo: image_photographer ?? '',
              fonte: image_source_url ?? '',
              licenca: image_license ?? '',
            }
          : null
      return { ...e, imagem }
    })
  }
}
