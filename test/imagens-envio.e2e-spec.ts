// Spec 002 · envio das imagens ao Storage LOCAL (rules/tests.md), com equipamentos próprios do teste
// (TESTE-*), para não mexer nas fotos dos 12 equipamentos reais.
import { execFileSync, execSync } from 'node:child_process'
import { mkdtempSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import sharp from 'sharp'
import { Pool } from 'pg'

jest.setTimeout(120_000)

const ROOT = join(__dirname, '..')
const status = (() => {
  const out = execSync('supabase status -o json', { cwd: ROOT, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] })
  return JSON.parse(out.slice(out.indexOf('{'), out.lastIndexOf('}') + 1)) as Record<string, string>
})()
for (const u of [status.DB_URL, status.API_URL]) {
  if (!/(127\.0\.0\.1|localhost)[:/]/.test(u ?? '')) throw new Error('Testes só rodam contra o Supabase local (rules/tests.md).')
}
const service = status.SERVICE_ROLE_KEY ?? status.SECRET_KEY

const pool = new Pool({ connectionString: status.DB_URL })
const sufixo = Date.now().toString(36)
const itens = [`TESTE-${sufixo}-A`, `TESTE-${sufixo}-B`]
const dir = mkdtempSync(join(tmpdir(), 'imagens-'))
const listaArquivo = join(dir, 'equipamentos.json')
const revisaoArquivo = join(dir, 'revisao.json')
const saidas: string[] = []

const enviar = () =>
  execFileSync(process.execPath, ['skills/imagens-equipamentos/scripts/enviar-imagens.mjs', '--local'], {
    cwd: ROOT,
    encoding: 'utf8',
    env: { ...process.env, IMAGENS_DIR: dir, REVISAO_ARQUIVO: revisaoArquivo, EQUIPAMENTOS_ARQUIVO: listaArquivo },
  })

beforeAll(async () => {
  const revisao: Record<string, unknown> = {}
  for (const [i, p] of itens.entries()) {
    await pool.query(`insert into public.equipments (patrimonio, nome, categoria) values ($1, 'Teste envio', 'acessorio')`, [p])
    const jpg = await sharp({ create: { width: 800, height: 600, channels: 3, background: i ? '#468' : '#864' } }).jpeg().toBuffer()
    writeFileSync(join(dir, `${p}.jpg`), jpg)
    revisao[p] = {
      source_id: `teste-${sufixo}-${i}`,
      fotografo: 'Autor de teste',
      source_url: 'https://pixabay.com/photos/teste/',
      licenca: 'Pixabay Content License',
      aprovada: true,
      motivo: '',
      reprovadas: [],
    }
  }
  writeFileSync(listaArquivo, JSON.stringify(itens.map((p) => ({ patrimonio: p }))))
  writeFileSync(revisaoArquivo, JSON.stringify(revisao))
  saidas.push(enviar(), enviar())
})

afterAll(async () => {
  await fetch(`${status.API_URL}/storage/v1/object/equipamentos`, {
    method: 'DELETE',
    headers: { apikey: service, Authorization: `Bearer ${service}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ prefixes: itens.map((p) => `${p}.jpg`) }),
  })
  await pool.query('delete from public.equipments where patrimonio = any($1)', [itens])
  await pool.end()
})

it('CA-03: cada imagem enviada abre pela URL pública, sem login', async () => {
  for (const p of itens) {
    const res = await fetch(`${status.API_URL}/storage/v1/object/public/equipamentos/${p}.jpg`)
    expect(res.status).toBe(200)
    expect(res.headers.get('content-type')).toMatch(/image\/jpeg/)
  }
})

it('CA-04: o que está no bucket tem 800x600', async () => {
  const res = await fetch(`${status.API_URL}/storage/v1/object/public/equipamentos/${itens[0]}.jpg`)
  const meta = await sharp(Buffer.from(await res.arrayBuffer())).metadata()
  expect([meta.width, meta.height]).toEqual([800, 600])
})

it('CA-06, CA-07: enviar duas vezes mantém 1 objeto por equipamento e grava o crédito', async () => {
  const objetos = await pool.query(
    `select count(*)::int as n from storage.objects where bucket_id = 'equipamentos' and name = any($1)`,
    [itens.map((p) => `${p}.jpg`)],
  )
  expect(objetos.rows[0].n).toBe(2)
  const { rows } = await pool.query(
    `select patrimonio, image_path, image_photographer, image_license from public.equipments where patrimonio = any($1) order by patrimonio`,
    [itens],
  )
  expect(rows).toEqual(
    itens.map((p) => ({ patrimonio: p, image_path: `${p}.jpg`, image_photographer: 'Autor de teste', image_license: 'Pixabay Content License' })),
  )
  expect(saidas[1]).toContain('destino local')
})

it('CA-10: sem aprovação humana de todas as fotos, o envio é recusado', () => {
  const revisao = { [itens[0]]: { source_id: 'x', aprovada: null }, [itens[1]]: { source_id: 'y', aprovada: true } }
  const r2 = join(dir, 'revisao-pendente.json')
  writeFileSync(r2, JSON.stringify(revisao))
  expect(() =>
    execFileSync(process.execPath, ['skills/imagens-equipamentos/scripts/enviar-imagens.mjs', '--local'], {
      cwd: ROOT,
      encoding: 'utf8',
      stdio: 'pipe',
      env: { ...process.env, IMAGENS_DIR: dir, REVISAO_ARQUIVO: r2, EQUIPAMENTOS_ARQUIVO: listaArquivo },
    }),
  ).toThrow(/sem aprovação humana/)
})
