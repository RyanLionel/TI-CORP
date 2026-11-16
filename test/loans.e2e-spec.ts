// Spec 001 · T3 e T4 · regras de empréstimo no banco (CA-01 a CA-07), autenticação e RLS (CA-08, CA-09).
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

// Executa com um papel do Postgres e, opcionalmente, um usuário (sub) nos claims.
async function asRole<T>(role: 'anon' | 'authenticated', uid: string | null, fn: (c: PoolClient) => Promise<T>): Promise<T> {
  const c = await pool.connect()
  try {
    await c.query('begin')
    await c.query(`set local role ${role}`)
    if (uid) await c.query(`select set_config('request.jwt.claims', $1, true)`, [JSON.stringify({ sub: uid, role })])
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

describe('autenticação e acesso (RLS)', () => {
  it('CA-08: sem usuário autenticado, request_loan recusa e não cria empréstimo', async () => {
    const eq = await createEquipment()
    await expect(
      asRole('authenticated', null, (c) => c.query('select * from public.request_loan($1)', [eq])),
    ).rejects.toThrow('Autenticação obrigatória')
    expect(await loansOf(eq)).toBe(0)
  })

  it('CA-08: o papel anon (chave pública sem login) não pode chamar request_loan', async () => {
    const eq = await createEquipment()
    await expect(
      asRole('anon', null, (c) => c.query('select * from public.request_loan($1)', [eq])),
    ).rejects.toThrow(/permission denied/)
    expect(await loansOf(eq)).toBe(0)
  })

  it('CA-08: o papel anon não lê empréstimos', async () => {
    const uid = await createUser()
    await requestLoan(uid, await createEquipment())
    // Sem grant: "permission denied". Com o grant padrão do Supabase: a RLS (só `authenticated`) devolve 0 linhas.
    const lidas = await asRole('anon', null, (c) => c.query('select id from public.loans')).then(
      (r) => r.rows.length,
      (e: Error) => {
        expect(e.message).toMatch(/permission denied/)
        return 0
      },
    )
    expect(lidas).toBe(0)
  })

  it('CA-09: um colaborador não lê o empréstimo de outro; o dono lê o próprio', async () => {
    const a = await createUser()
    const b = await createUser()
    const loanA = await requestLoan(a, await createEquipment())
    const vistoPorB = await asRole('authenticated', b, (c) => c.query('select id from public.loans where id = $1', [loanA.id]))
    expect(vistoPorB.rows).toHaveLength(0)
    const vistoPorA = await asRole('authenticated', a, (c) => c.query('select id from public.loans where id = $1', [loanA.id]))
    expect(vistoPorA.rows).toHaveLength(1)
  })

  it('CA-09: um colaborador só enxerga os próprios empréstimos na listagem', async () => {
    const a = await createUser()
    const b = await createUser()
    await requestLoan(a, await createEquipment())
    await requestLoan(b, await createEquipment())
    const { rows } = await asRole('authenticated', b, (c) => c.query('select borrower_id from public.loans'))
    expect(rows.length).toBeGreaterThan(0)
    expect(rows.every((r) => r.borrower_id === b)).toBe(true)
  })

  it('CA-09: Operações lê os empréstimos de todos', async () => {
    const a = await createUser()
    const b = await createUser()
    const ops = await createUser()
    await pool.query(`update public.profiles set role = 'operacoes' where id = $1`, [ops])
    const loanA = await requestLoan(a, await createEquipment())
    const loanB = await requestLoan(b, await createEquipment())
    const { rows } = await asRole('authenticated', ops, (c) =>
      c.query('select id from public.loans where id = any($1)', [[loanA.id, loanB.id]]),
    )
    expect(rows).toHaveLength(2)
  })
})
