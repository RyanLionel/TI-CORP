// Spec 005 · devolver empréstimo (CA-01 a CA-07), com autenticação real pelo Supabase Auth LOCAL.
// Banco e Auth locais (rules/tests.md). URL e chave pública vêm de `supabase status`; nada de produção.
import { execSync } from 'node:child_process'
import { randomUUID } from 'node:crypto'
import { Test } from '@nestjs/testing'
import { INestApplication } from '@nestjs/common'
import request from 'supertest'
import { Pool } from 'pg'
import { AppModule } from '../src/app.module'

const DB_URL = process.env.TEST_DATABASE_URL ?? 'postgresql://postgres:postgres@127.0.0.1:54322/postgres'

function localSupabase(): { url: string; anonKey: string } {
  let url = process.env.TEST_SUPABASE_URL
  let anonKey = process.env.TEST_SUPABASE_ANON_KEY
  if (!url || !anonKey) {
    const out = execSync('supabase status -o json', { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] })
    const status = JSON.parse(out.slice(out.indexOf('{'), out.lastIndexOf('}') + 1)) as Record<string, string>
    url = status.API_URL
    anonKey = status.ANON_KEY ?? status.PUBLISHABLE_KEY
  }
  if (!url || !anonKey) throw new Error('Não achei a URL/chave do Supabase local (rode `npm run db:up`).')
  return { url, anonKey }
}

const supa = localSupabase()
for (const u of [DB_URL, supa.url]) {
  if (!/(127\.0\.0\.1|localhost)[:/]/.test(u)) {
    throw new Error('Testes só rodam contra o Supabase local (rules/tests.md).')
  }
}

const pool = new Pool({ connectionString: DB_URL })
const users: string[] = []
const equipments: string[] = []

async function signUp(): Promise<{ id: string; token: string }> {
  const res = await fetch(`${supa.url}/auth/v1/signup`, {
    method: 'POST',
    headers: { apikey: supa.anonKey, 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: `dev-${randomUUID()}@exemplo.local`, password: randomUUID() }),
  })
  const body = (await res.json()) as { access_token?: string; user?: { id: string } }
  if (!res.ok || !body.access_token || !body.user) throw new Error(`signup local falhou: ${res.status}`)
  users.push(body.user.id)
  return { id: body.user.id, token: body.access_token }
}

async function createEquipment(): Promise<string> {
  const { rows } = await pool.query(
    `insert into public.equipments (nome, categoria, condition) values ('Equipamento de teste devolução', 'acessorio', 'disponivel') returning id`,
  )
  equipments.push(rows[0].id)
  return rows[0].id
}

let app: INestApplication
const http = () => request(app.getHttpServer())
const auth = (t: string) => ({ Authorization: `Bearer ${t}` })
const pedir = async (token: string, equipmentId: string) => {
  const res = await http().post('/loans').set(auth(token)).send({ equipmentId })
  expect(res.status).toBe(201)
  return res.body.id as string
}

beforeAll(async () => {
  process.env.DATABASE_URL = DB_URL
  process.env.SUPABASE_URL = supa.url
  process.env.SUPABASE_ANON_KEY = supa.anonKey
  const mod = await Test.createTestingModule({ imports: [AppModule] }).compile()
  app = mod.createNestApplication()
  await app.init()
})

afterAll(async () => {
  await app?.close()
  if (users.length) await pool.query('delete from public.loans where borrower_id = any($1)', [users])
  if (equipments.length) await pool.query('delete from public.equipments where id = any($1)', [equipments])
  if (users.length) await pool.query('delete from auth.users where id = any($1)', [users])
  await pool.end()
})

describe('POST /loans/:id/return (spec 005)', () => {
  it('CA-01: devolve o próprio empréstimo; returned_at e returned_by ficam gravados', async () => {
    const a = await signUp()
    const loanId = await pedir(a.token, await createEquipment())
    const res = await http().post(`/loans/${loanId}/return`).set(auth(a.token))
    expect(res.status).toBe(200)
    expect(res.body.id).toBe(loanId)
    expect(new Date(res.body.returnedAt).toISOString()).toBe(res.body.returnedAt)
    const { rows } = await pool.query('select returned_at, returned_by from public.loans where id = $1', [loanId])
    expect(rows[0].returned_at).not.toBeNull()
    expect(rows[0].returned_by).toBe(a.id)
  })

  it('CA-02: depois de devolver, some de /loans/me, o equipamento volta a disponível e pode ser pedido de novo', async () => {
    const a = await signUp()
    const eq = await createEquipment()
    const loanId = await pedir(a.token, eq)
    await http().post(`/loans/${loanId}/return`).set(auth(a.token)).expect(200)
    const me = await http().get('/loans/me').set(auth(a.token))
    expect(me.body.map((l: { id: string }) => l.id)).not.toContain(loanId)
    const cat = await http().get('/equipments').set(auth(a.token))
    expect(cat.body.find((e: { id: string }) => e.id === eq).situacao).toBe('disponivel')
    await pedir(a.token, eq)
  })

  it('CA-03: devolver o empréstimo de outra pessoa devolve 403', async () => {
    const a = await signUp()
    const b = await signUp()
    const loanId = await pedir(a.token, await createEquipment())
    const res = await http().post(`/loans/${loanId}/return`).set(auth(b.token))
    expect(res.status).toBe(403)
    expect(res.body.message).toBe('Sem permissão para registrar esta devolução')
    const { rows } = await pool.query('select returned_at from public.loans where id = $1', [loanId])
    expect(rows[0].returned_at).toBeNull()
  })

  it('CA-04: devolver de novo um empréstimo já devolvido devolve 409', async () => {
    const a = await signUp()
    const loanId = await pedir(a.token, await createEquipment())
    await http().post(`/loans/${loanId}/return`).set(auth(a.token)).expect(200)
    const res = await http().post(`/loans/${loanId}/return`).set(auth(a.token))
    expect(res.status).toBe(409)
    expect(res.body.message).toBe('Empréstimo já devolvido')
  })

  it('CA-05: id inexistente devolve 404 e id que não é UUID devolve 400', async () => {
    const a = await signUp()
    const nf = await http().post(`/loans/${randomUUID()}/return`).set(auth(a.token))
    expect(nf.status).toBe(404)
    expect(nf.body.message).toBe('Empréstimo não encontrado')
    const bad = await http().post('/loans/nao-e-uuid/return').set(auth(a.token))
    expect(bad.status).toBe(400)
    expect(bad.body.message).toBe('id deve ser um UUID')
  })

  it('CA-06: sem token ou com token inválido devolve 401', async () => {
    const semToken = await http().post(`/loans/${randomUUID()}/return`)
    expect(semToken.status).toBe(401)
    const invalido = await http().post(`/loans/${randomUUID()}/return`).set(auth('token-invalido'))
    expect(invalido.status).toBe(401)
  })

  it('CA-07: com 5 em aberto, devolver 1 libera vaga para um novo pedido', async () => {
    const a = await signUp()
    const ids: string[] = []
    for (let i = 0; i < 5; i++) ids.push(await pedir(a.token, await createEquipment()))
    const extra = await createEquipment()
    const recusa = await http().post('/loans').set(auth(a.token)).send({ equipmentId: extra })
    expect(recusa.status).toBe(409)
    await http().post(`/loans/${ids[0]}/return`).set(auth(a.token)).expect(200)
    await pedir(a.token, extra)
  })
})
