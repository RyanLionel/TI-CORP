// Spec 002 · T3 · seed idempotente: 12 equipamentos (chave natural = patrimônio) e a conta do professor (chave = e-mail).
// Uso local:      npm run seed:local          (pega URL e chaves do Supabase local por `supabase status`)
// Uso produção:   SEED_CONFIRM_REMOTE=sim npm run seed:dados-iniciais   (só o humano; ver docs/producao.md)
// Nenhum empréstimo é criado (regra 3). A senha do professor vem de SEED_PROFESSOR_PASSWORD, nunca de arquivo (regra 7).
import { readFileSync } from 'node:fs'
import { execSync } from 'node:child_process'
import pg from 'pg'

const PROFESSOR_EMAIL = 'marcelo.grilo@institutojef.org.br'
const LOCAL = process.argv.includes('--local')

try { process.loadEnvFile() } catch { /* sem .env: usa o ambiente */ }
const env = process.env

function fail(msg) {
  console.error(`seed: ${msg}`)
  process.exit(1)
}

function localStatus() {
  const out = execSync('supabase status -o json', { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] })
  return JSON.parse(out.slice(out.indexOf('{'), out.lastIndexOf('}') + 1))
}

const isLocal = (u) => /(127\.0\.0\.1|localhost)[:/]/.test(u ?? '')

let dbUrl, supaUrl, serviceKey
if (LOCAL) {
  const s = localStatus()
  dbUrl = s.DB_URL
  supaUrl = s.API_URL
  serviceKey = s.SERVICE_ROLE_KEY ?? s.SECRET_KEY
} else {
  dbUrl = env.DIRECT_URL ?? env.DATABASE_URL
  supaUrl = env.SUPABASE_URL
  serviceKey = env.SUPABASE_SERVICE_ROLE_KEY
}
if (!dbUrl || !supaUrl || !serviceKey) fail('faltam DIRECT_URL, SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY (ou rode com --local).')

const remoto = !isLocal(dbUrl) || !isLocal(supaUrl)
if (remoto && env.SEED_CONFIRM_REMOTE !== 'sim') {
  fail('o destino não é local. Escrever em produção é do humano: rode com SEED_CONFIRM_REMOTE=sim (docs/producao.md).')
}
console.log(`seed: destino ${remoto ? 'REMOTO' : 'local'}`)

const equipamentos = JSON.parse(readFileSync(new URL('./dados-iniciais/equipamentos.json', import.meta.url), 'utf8'))
const pool = new pg.Pool({ connectionString: dbUrl })

try {
  // Equipamentos: upsert por patrimônio, numa transação só.
  const c = await pool.connect()
  try {
    await c.query('begin')
    for (const e of equipamentos) {
      await c.query(
        `insert into public.equipments (patrimonio, nome, categoria, condition)
         values ($1, $2, $3::public.equipment_category, $4::public.equipment_condition)
         on conflict (patrimonio) where patrimonio is not null
         do update set nome = excluded.nome, categoria = excluded.categoria, condition = excluded.condition`,
        [e.patrimonio, e.nome, e.categoria, e.situacao],
      )
    }
    await c.query('commit')
  } catch (err) {
    await c.query('rollback')
    throw err
  } finally {
    c.release()
  }

  // Professor: cria pelo Admin API do Supabase Auth só se ainda não existir.
  const existe = await pool.query('select id from auth.users where email = $1', [PROFESSOR_EMAIL])
  if (existe.rowCount) {
    console.log('seed: conta do professor já existe (nada alterado)')
  } else if (!env.SEED_PROFESSOR_PASSWORD) {
    if (remoto) fail('SEED_PROFESSOR_PASSWORD não definida.')
    console.log('seed: SEED_PROFESSOR_PASSWORD não definida; conta do professor não criada (local)')
  } else {
    const res = await fetch(`${supaUrl.replace(/\/$/, '')}/auth/v1/admin/users`, {
      method: 'POST',
      headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: PROFESSOR_EMAIL,
        password: env.SEED_PROFESSOR_PASSWORD,
        email_confirm: true,
        user_metadata: { nome: 'Marcelo Grilo' },
      }),
    })
    if (!res.ok) fail(`não consegui criar a conta do professor (HTTP ${res.status}).`)
    console.log('seed: conta do professor criada')
  }

  const { rows } = await pool.query(
    `select
       (select count(*) from public.equipments where patrimonio like 'TI-%')::int as equipamentos,
       (select count(*) from public.equipments where patrimonio like 'TI-%' and condition = 'manutencao')::int as manutencao,
       (select count(*) from public.loans l join auth.users u on u.id = l.borrower_id where u.email = $1)::int as emprestimos_professor`,
    [PROFESSOR_EMAIL],
  )
  console.log(`seed: ${rows[0].equipamentos} equipamentos (${rows[0].manutencao} em manutenção); empréstimos do professor: ${rows[0].emprestimos_professor}`)
} finally {
  await pool.end()
}
