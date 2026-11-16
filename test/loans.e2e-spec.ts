// Spec 001 · T3 · regras de empréstimo no banco (CA-01 a CA-07).
// Roda contra o banco LOCAL (rules/tests.md): sem mock, a coisa sob teste são as funções e o trigger.
import { Pool, PoolClient } from 'pg'

const DB_URL = process.env.TEST_DATABASE_URL ?? 'postgresql://postgres:postgres@127.0.0.1:54322/postgres'
if (!/@(127\.0\.0\.1|localhost):/.test(DB_URL)) {
  throw new Error('Testes só rodam contra o banco local (rules/tests.md). TEST_DATABASE_URL não é local.')
}

const pool = new Pool({ connectionString: DB_URL })
const users: string[] = []
const equipments: string[] = []

async function createUser(): Promise<string> {
  const email = `teste-${Date.now()}-${Math.random().toString(36).slice(2)}@exemplo.local`
  const { rows } = await pool.query(
    'insert into auth.users (id, email) values (gen_random_uuid(), $1) returning id',
    [email],
  )
  users.push(rows[0].id)
  return rows[0].id
}

async function createEquipment(condition: 'disponivel' | 'manutencao' = 'disponivel'): Promise<string> {
  const { rows } = await pool.query(
    `insert into public.equipments (nome, categoria, condition) values ('Equipamento de teste', 'acessorio', $1) returning id`,
    [condition],
  )
  equipments.push(rows[0].id)
  return rows[0].id
}

// Executa como o usuário autenticado: papel `authenticated` + claims na transação (o mesmo que a API fará).
async function asUser<T>(uid: string, fn: (c: PoolClient) => Promise<T>): Promise<T> {
  const c = await pool.connect()
  try {
    await c.query('begin')
    await c.query('set local role authenticated')
    await c.query(`select set_config('request.jwt.claims', $1, true)`, [JSON.stringify({ sub: uid, role: 'authenticated' })])
    const result = await fn(c)
    await c.query('commit')
    return result
  } catch (e) {
    await c.query('rollback')
    throw e
  } finally {
    c.release()
  }
}

const requestLoan = (uid: string, equipmentId: string) =>
  asUser(uid, async (c) => (await c.query('select * from public.request_loan($1)', [equipmentId])).rows[0])

const loansOf = async (equipmentId: string) =>
  Number((await pool.query('select count(*) from public.loans where equipment_id = $1', [equipmentId])).rows[0].count)

afterAll(async () => {
  if (users.length) await pool.query('delete from public.loans where borrower_id = any($1)', [users])
  if (equipments.length) await pool.query('delete from public.equipments where id = any($1)', [equipments])
  if (users.length) await pool.query('delete from auth.users where id = any($1)', [users])
  await pool.end()
})

describe('add_business_days', () => {
  it('CA-01: sexta + 1 dia útil cai na segunda', async () => {
    const { rows } = await pool.query(
      `select public.add_business_days('2026-11-13 12:00-03', 1) = '2026-11-16 12:00-03' as ok`,
    )
    expect(rows[0].ok).toBe(true)
  })

  it('CA-01: segunda 16/11/2026 + 14 dias úteis = sexta 04/12/2026', async () => {
    const { rows } = await pool.query(
      `select public.add_business_days('2026-11-16 10:00-03', 14) = '2026-12-04 10:00-03' as ok`,
    )
    expect(rows[0].ok).toBe(true)
  })
})

describe('request_loan', () => {
  it('CA-01: cria 1 empréstimo do usuário logado com devolução em 14 dias úteis', async () => {
    const uid = await createUser()
    const eq = await createEquipment()
    const loan = await requestLoan(uid, eq)
    expect(loan.borrower_id).toBe(uid)
    expect(loan.equipment_id).toBe(eq)
    const { rows } = await pool.query(
      'select due_at = public.add_business_days(checked_out_at, 14) as ok from public.loans where id = $1',
      [loan.id],
    )
    expect(rows[0].ok).toBe(true)
    expect(await loansOf(eq)).toBe(1)
  })

  it('CA-02: depois de solicitado, o equipamento deixa de estar disponível', async () => {
    const uid = await createUser()
    const eq = await createEquipment()
    await requestLoan(uid, eq)
    const { rows } = await pool.query(
      `select exists (select 1 from public.loans where equipment_id = $1 and returned_at is null) as emprestado`,
      [eq],
    )
    expect(rows[0].emprestado).toBe(true)
  })

  it('CA-03: equipamento em manutenção é recusado com motivo e não cria empréstimo', async () => {
    const uid = await createUser()
    const eq = await createEquipment('manutencao')
    await expect(requestLoan(uid, eq)).rejects.toThrow('Equipamento em manutenção')
    expect(await loansOf(eq)).toBe(0)
  })

  it('CA-04: equipamento já emprestado é recusado com motivo e não cria empréstimo', async () => {
    const a = await createUser()
    const b = await createUser()
    const eq = await createEquipment()
    await requestLoan(a, eq)
    await expect(requestLoan(b, eq)).rejects.toThrow('Equipamento já emprestado')
    expect(await loansOf(eq)).toBe(1)
  })

  it('CA-05: com 5 empréstimos em aberto, a 6ª solicitação é recusada com a mensagem de limite', async () => {
    const uid = await createUser()
    for (let i = 0; i < 5; i++) await requestLoan(uid, await createEquipment())
    const sexto = await createEquipment()
    await expect(requestLoan(uid, sexto)).rejects.toThrow('Limite de 5 empréstimos em aberto atingido')
    expect(await loansOf(sexto)).toBe(0)
  })

  it('CA-06: com empréstimo em atraso, a solicitação é recusada com a mensagem de atraso', async () => {
    const uid = await createUser()
    const atrasado = await createEquipment()
    await pool.query(
      `insert into public.loans (equipment_id, borrower_id, checked_out_at, due_at)
       values ($1, $2, now() - interval '20 days', now() - interval '1 day')`,
      [atrasado, uid],
    )
    const eq = await createEquipment()
    await expect(requestLoan(uid, eq)).rejects.toThrow('Você tem empréstimo em atraso')
    expect(await loansOf(eq)).toBe(0)
  })

  it('CA-06: empréstimo em aberto dentro do prazo não bloqueia', async () => {
    const uid = await createUser()
    await requestLoan(uid, await createEquipment())
    const eq = await createEquipment()
    await expect(requestLoan(uid, eq)).resolves.toMatchObject({ borrower_id: uid })
  })

  it('CA-07: duas solicitações simultâneas ao mesmo equipamento geram exatamente 1 empréstimo', async () => {
    const a = await createUser()
    const b = await createUser()
    const eq = await createEquipment()
    const results = await Promise.allSettled([requestLoan(a, eq), requestLoan(b, eq)])
    expect(results.filter((r) => r.status === 'fulfilled')).toHaveLength(1)
    expect(results.filter((r) => r.status === 'rejected')).toHaveLength(1)
    expect(await loansOf(eq)).toBe(1)
  })
})
