// Spec 002 · T3 · seed dos dados iniciais rodado 2x contra o Supabase LOCAL (rules/tests.md).
// Atenção: apaga e recria a conta local do professor para provar a criação (só no banco local).
import { execFileSync, execSync } from 'node:child_process'
import { randomUUID } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { Pool } from 'pg'

jest.setTimeout(120_000)

const ROOT = join(__dirname, '..')
const PROFESSOR = 'marcelo.grilo@institutojef.org.br'
const lista = JSON.parse(readFileSync(join(ROOT, 'scripts/dados-iniciais/equipamentos.json'), 'utf8')) as {
  patrimonio: string
  nome: string
  categoria: string
  situacao: string
}[]

const status = (() => {
  const out = execSync('supabase status -o json', { cwd: ROOT, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] })
  return JSON.parse(out.slice(out.indexOf('{'), out.lastIndexOf('}') + 1)) as Record<string, string>
})()
for (const u of [status.DB_URL, status.API_URL]) {
  if (!/(127\.0\.0\.1|localhost)[:/]/.test(u ?? '')) throw new Error('Testes só rodam contra o Supabase local (rules/tests.md).')
}

const pool = new Pool({ connectionString: status.DB_URL })
const senha = randomUUID() // gerada na hora; nunca em arquivo (rules/secrets.md)
const saidas: string[] = []

beforeAll(async () => {
  await pool.query('delete from auth.users where email = $1', [PROFESSOR])
  for (let i = 0; i < 2; i++) {
    saidas.push(
      execFileSync(process.execPath, ['scripts/seed-dados-iniciais.mjs', '--local'], {
        cwd: ROOT,
        encoding: 'utf8',
        env: { ...process.env, SEED_PROFESSOR_PASSWORD: senha },
      }),
    )
  }
})

afterAll(async () => {
  await pool.end()
})

it('CA-01: existem exatamente os 12 equipamentos da lista, com patrimônio, nome e categoria', async () => {
  const { rows } = await pool.query(
    `select patrimonio, nome, categoria::text as categoria from public.equipments where patrimonio like 'TI-%' order by patrimonio`,
  )
  expect(rows).toEqual(lista.map(({ patrimonio, nome, categoria }) => ({ patrimonio, nome, categoria })))
})

it('CA-02: TI-0004, TI-0007 e TI-0010 em manutenção; os outros 9 disponíveis', async () => {
  const { rows } = await pool.query(
    `select patrimonio from public.equipments where patrimonio like 'TI-%' and condition = 'manutencao' order by patrimonio`,
  )
  expect(rows.map((r) => r.patrimonio)).toEqual(['TI-0004', 'TI-0007', 'TI-0010'])
  const disp = await pool.query(`select count(*)::int as n from public.equipments where patrimonio like 'TI-%' and condition = 'disponivel'`)
  expect(disp.rows[0].n).toBe(9)
})

it('CA-07: rodar o seed duas vezes mantém 12 equipamentos e 1 conta do professor', async () => {
  const { rows } = await pool.query(
    `select (select count(*) from public.equipments where patrimonio like 'TI-%')::int as eq,
            (select count(*) from auth.users where email = $1)::int as prof`,
    [PROFESSOR],
  )
  expect(rows[0]).toEqual({ eq: 12, prof: 1 })
  expect(saidas[0]).toContain('conta do professor criada')
  expect(saidas[1]).toContain('conta do professor já existe')
})

it('CA-08: a conta do professor autentica e tem 0 empréstimos', async () => {
  const anon = status.ANON_KEY ?? status.PUBLISHABLE_KEY
  const res = await fetch(`${status.API_URL}/auth/v1/token?grant_type=password`, {
    method: 'POST',
    headers: { apikey: anon, 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: PROFESSOR, password: senha }),
  })
  expect(res.status).toBe(200)
  const { rows } = await pool.query(
    `select count(*)::int as n from public.loans l join auth.users u on u.id = l.borrower_id where u.email = $1`,
    [PROFESSOR],
  )
  expect(rows[0].n).toBe(0)
})

