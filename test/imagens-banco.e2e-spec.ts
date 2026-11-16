// Spec 002 · T2 · garantias do banco para as imagens (CA-05, CA-06), contra o banco LOCAL (rules/tests.md).
import { Pool } from 'pg'

const DB_URL = process.env.TEST_DATABASE_URL ?? 'postgresql://postgres:postgres@127.0.0.1:54322/postgres'
if (!/@(127\.0\.0\.1|localhost):/.test(DB_URL)) throw new Error('Testes só rodam contra o banco local (rules/tests.md).')

const pool = new Pool({ connectionString: DB_URL })
const ids: string[] = []

async function equipamento(): Promise<string> {
  const { rows } = await pool.query(
    `insert into public.equipments (nome, categoria) values ('Teste imagem', 'acessorio') returning id`,
  )
  ids.push(rows[0].id)
  return rows[0].id
}

const credito = (sourceId: string): (string | null)[] => [
  `teste/${sourceId}.jpg`,
  sourceId,
  'Fotógrafo de teste',
  `https://pixabay.com/photos/${sourceId}/`,
  'Pixabay Content License',
]

const gravar = (id: string, v: (string | null)[]) =>
  pool.query(
    `update public.equipments set image_path = $2, image_source_id = $3, image_photographer = $4,
       image_source_url = $5, image_license = $6 where id = $1`,
    [id, ...v],
  )

afterAll(async () => {
  if (ids.length) await pool.query('delete from public.equipments where id = any($1)', [ids])
  await pool.end()
})

it('CA-06: imagem com crédito completo (origem, autor e licença) é aceita', async () => {
  const id = await equipamento()
  await expect(gravar(id, credito(`ok-${Date.now()}`))).resolves.toBeTruthy()
})

it('CA-06: imagem sem autor ou sem licença é recusada pelo banco', async () => {
  const id = await equipamento()
  const semAutor = credito(`sa-${Date.now()}`)
  semAutor[2] = null
  await expect(gravar(id, semAutor)).rejects.toThrow(/equipments_image_credito_completo/)
  const semLicenca = credito(`sl-${Date.now()}`)
  semLicenca[4] = null
  await expect(gravar(id, semLicenca)).rejects.toThrow(/equipments_image_credito_completo/)
})

it('CA-05: a mesma foto do Pixabay não entra em dois equipamentos', async () => {
  const a = await equipamento()
  const b = await equipamento()
  const foto = `dup-${Date.now()}`
  await gravar(a, credito(foto))
  await expect(gravar(b, credito(foto))).rejects.toThrow(/equipments_image_source_id_unique/)
})
