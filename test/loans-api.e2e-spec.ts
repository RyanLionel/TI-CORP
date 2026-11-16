// Spec 001 · T5 · contrato REST (CA-10), com autenticação real pelo Supabase Auth LOCAL.
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

// Cria um usuário no Auth local e devolve o token. Senha aleatória, gerada na hora (rules/secrets.md).
async function signUp(): Promise<{ id: string; token: string }> {
  const res = await fetch(`${supa.url}/auth/v1/signup`, {
    method: 'POST',
    headers: { apikey: supa.anonKey, 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: `api-${randomUUID()}@exemplo.local`, password: randomUUID() }),
  })
  const body = (await res.json()) as { access_token?: string; user?: { id: string } }
  if (!res.ok || !body.access_token || !body.user) throw new Error(`signup local falhou: ${res.status}`)
  users.push(body.user.id)
  return { id: body.user.id, token: body.access_token }
}

async function createEquipment(condition: 'disponivel' | 'manutencao' = 'disponivel'): Promise<string> {
  const { rows } = await pool.query(
    `insert into public.equipments (nome, categoria, condition) values ('Equipamento de teste API', 'acessorio', $1) returning id`,
    [condition],
  )
  equipments.push(rows[0].id)
  return rows[0].id
}

let app: INestApplication
let a: { id: string; token: string } // colaborador principal
let b: { id: string; token: string } // outro colaborador
let c: { id: string; token: string } // limite de 5
let d: { id: string; token: string } // atraso
const http = () => request(app.getHttpServer())
const auth = (t: string) => ({ Authorization: `Bearer ${t}` })

beforeAll(async () => {
  process.env.DATABASE_URL = DB_URL
  process.env.SUPABASE_URL = supa.url
  process.env.SUPABASE_ANON_KEY = supa.anonKey
  const mod = await Test.createTestingModule({ imports: [AppModule] }).compile()
  app = mod.createNestApplication()
  await app.init()
  a = await signUp()
  b = await signUp()
  c = await signUp()
  d = await signUp()
})

afterAll(async () => {
  await app?.close()
  if (users.length) await pool.query('delete from public.loans where borrower_id = any($1)', [users])
  if (equipments.length) await pool.query('delete from public.equipments where id = any($1)', [equipments])
  if (users.length) await pool.query('delete from auth.users where id = any($1)', [users])
  await pool.end()
})

describe('sem autenticação', () => {
  it.each([
    ['get', '/equipments'],
    ['get', '/loans/me'],
    ['post', '/loans'],
  ] as const)('CA-08: %s %s sem token devolve 401', async (method, path) => {
    const res = await http()[method](path)
    expect(res.status).toBe(401)
    expect(res.body.message).toBe('Autenticação obrigatória')
  })

  it('CA-08: token inválido devolve 401', async () => {
    const res = await http().get('/equipments').set(auth('token-invalido'))
    expect(res.status).toBe(401)
    expect(res.body.message).toBe('Sessão inválida')
  })
})

describe('GET /equipments', () => {
  it('CA-10: lista equipamentos com situacao e imagem', async () => {
    const livre = await createEquipment()
    const manut = await createEquipment('manutencao')
    const res = await http().get('/equipments').set(auth(a.token))
    expect(res.status).toBe(200)
    expect(res.body.find((e: { id: string }) => e.id === livre)).toMatchObject({
      id: livre,
      nome: 'Equipamento de teste API',
      categoria: 'acessorio',
      situacao: 'disponivel',
      imagem: null,
    })
    expect(res.body.find((e: { id: string }) => e.id === manut)).toMatchObject({ situacao: 'manutencao' })
  })
  it('CA-10: equipamento com foto devolve imagem { url, fotografo, fonte, licenca } (spec 002)', async () => {
    const eq = await createEquipment()
    const fotoId = `api-${randomUUID()}`
    await pool.query(
      `update public.equipments set image_path = $2, image_source_id = $3, image_photographer = 'Fotógrafo X',
         image_source_url = 'https://pixabay.com/photos/x/', image_license = 'Pixabay Content License' where id = $1`,
      [eq, `teste/${fotoId}.jpg`, fotoId],
    )
    const res = await http().get('/equipments').set(auth(a.token))
    expect(res.body.find((e: { id: string }) => e.id === eq).imagem).toEqual({
      url: `${supa.url.replace(/\/$/, '')}/storage/v1/object/public/equipamentos/teste/${fotoId}.jpg`,
      fotografo: 'Fotógrafo X',
      fonte: 'https://pixabay.com/photos/x/',
      licenca: 'Pixabay Content License',
    })
  })
})

describe('POST /loans', () => {
  it('CA-01, CA-10: solicitar equipamento disponível devolve 201 com id, equipmentId e dueAt', async () => {
    const eq = await createEquipment()
    const res = await http().post('/loans').set(auth(a.token)).send({ equipmentId: eq })
    expect(res.status).toBe(201)
    expect(res.body).toEqual({ id: expect.any(String), equipmentId: eq, dueAt: expect.any(String) })
    const { rows } = await pool.query(
      'select borrower_id, due_at = public.add_business_days(checked_out_at, 14) as prazo_ok from public.loans where id = $1',
      [res.body.id],
    )
    expect(rows[0]).toEqual({ borrower_id: a.id, prazo_ok: true })
  })

  it('CA-02: depois de solicitado, o catálogo mostra o equipamento como emprestado (também para outro usuário)', async () => {
    const eq = await createEquipment()
    await http().post('/loans').set(auth(a.token)).send({ equipmentId: eq }).expect(201)
    const res = await http().get('/equipments').set(auth(b.token))
    expect(res.body.find((e: { id: string }) => e.id === eq)).toMatchObject({ situacao: 'emprestado' })
  })

  it.each([[{}], [{ equipmentId: 'abc' }]])('CA-10: body inválido %j devolve 400', async (body) => {
    const res = await http().post('/loans').set(auth(a.token)).send(body)
    expect(res.status).toBe(400)
    expect(res.body.message).toBe('equipmentId deve ser um UUID')
  })

  it('CA-03, CA-10: equipamento em manutenção devolve 409 com o motivo', async () => {
    const eq = await createEquipment('manutencao')
    const res = await http().post('/loans').set(auth(a.token)).send({ equipmentId: eq })
    expect(res.status).toBe(409)
    expect(res.body.message).toBe('Equipamento em manutenção')
  })

  it('CA-04, CA-10: equipamento já emprestado devolve 409 com o motivo', async () => {
    const eq = await createEquipment()
    await http().post('/loans').set(auth(a.token)).send({ equipmentId: eq }).expect(201)
    const res = await http().post('/loans').set(auth(b.token)).send({ equipmentId: eq })
    expect(res.status).toBe(409)
    expect(res.body.message).toBe('Equipamento já emprestado')
  })

  it('CA-05, CA-10: com 5 em aberto, a 6ª devolve 409 com a mensagem de limite', async () => {
    for (let i = 0; i < 5; i++) {
      await http().post('/loans').set(auth(c.token)).send({ equipmentId: await createEquipment() }).expect(201)
    }
    const res = await http().post('/loans').set(auth(c.token)).send({ equipmentId: await createEquipment() })
    expect(res.status).toBe(409)
    expect(res.body.message).toBe('Limite de 5 empréstimos em aberto atingido')
  })

  it('CA-06, CA-10: com empréstimo em atraso devolve 409 com a mensagem de atraso', async () => {
    await pool.query(
      `insert into public.loans (equipment_id, borrower_id, checked_out_at, due_at)
       values ($1, $2, now() - interval '20 days', now() - interval '1 day')`,
      [await createEquipment(), d.id],
    )
    const res = await http().post('/loans').set(auth(d.token)).send({ equipmentId: await createEquipment() })
    expect(res.status).toBe(409)
    expect(res.body.message).toBe('Você tem empréstimo em atraso')
  })
})

describe('GET /loans/me', () => {
  it('CA-09, CA-10: devolve só os empréstimos em aberto do usuário, com dueAt e atrasado', async () => {
    const res = await http().get('/loans/me').set(auth(d.token))
    expect(res.status).toBe(200)
    expect(res.body).toHaveLength(1)
    expect(res.body[0]).toEqual({ id: expect.any(String), equipmentId: expect.any(String), dueAt: expect.any(String), atrasado: true })

    // c tem os 5 empréstimos do teste de limite, todos dentro do prazo.
    const deC = await http().get('/loans/me').set(auth(c.token))
    expect(deC.status).toBe(200)
    expect(deC.body).toHaveLength(5)
    expect(deC.body.every((l: { atrasado: boolean }) => l.atrasado === false)).toBe(true)
  })

  it('CA-10: empréstimo devolvido não aparece em GET /loans/me', async () => {
    const eq = await createEquipment()
    const criado = await http().post('/loans').set(auth(b.token)).send({ equipmentId: eq })
    expect(criado.status).toBe(201)
    await pool.query('update public.loans set returned_at = now() where id = $1', [criado.body.id])
    const res = await http().get('/loans/me').set(auth(b.token))
    expect(res.status).toBe(200)
    expect(res.body.map((l: { id: string }) => l.id)).not.toContain(criado.body.id)
  })
})
