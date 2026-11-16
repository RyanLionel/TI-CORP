// Spec 002 · skill imagens-equipamentos · etapa 3/4: enviar as fotos APROVADAS ao Storage e gravar o crédito.
// Local:    npm run imagens:enviar:local
// Produção: SEED_CONFIRM_REMOTE=sim npm run imagens:enviar   (só o humano; docs/producao.md)
import { createRequire } from 'node:module'
import { execSync } from 'node:child_process'
import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import pg from 'pg'

const require = createRequire(import.meta.url)
const lib = require('./lib.cjs')
const LOCAL = process.argv.includes('--local')

try { process.loadEnvFile() } catch { /* sem .env: usa o ambiente */ }
const env = process.env
const fail = (m) => {
  console.error(`imagens: ${m}`)
  process.exit(1)
}

const RAIZ = process.cwd()
const PASTA = env.IMAGENS_DIR ?? join(RAIZ, 'tmp', 'imagens')
const REVISAO = env.REVISAO_ARQUIVO ?? join(RAIZ, 'scripts', 'dados-iniciais', 'revisao-imagens.json')
const isLocal = (u) => /(127\.0\.0\.1|localhost)[:/]/.test(u ?? '')

let dbUrl, supaUrl, serviceKey
if (LOCAL) {
  const out = execSync('supabase status -o json', { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] })
  const s = JSON.parse(out.slice(out.indexOf('{'), out.lastIndexOf('}') + 1))
  dbUrl = s.DB_URL
  supaUrl = s.API_URL
  serviceKey = s.SERVICE_ROLE_KEY ?? s.SECRET_KEY
} else {
  dbUrl = env.DIRECT_URL ?? env.DATABASE_URL
  supaUrl = env.SUPABASE_URL
  serviceKey = env.SUPABASE_SERVICE_ROLE_KEY
}
if (!dbUrl || !supaUrl || !serviceKey) fail('faltam DIRECT_URL, SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY (ou use --local).')
const remoto = !isLocal(dbUrl) || !isLocal(supaUrl)
if (remoto && env.SEED_CONFIRM_REMOTE !== 'sim') {
  fail('o destino não é local. Enviar para produção é do humano: SEED_CONFIRM_REMOTE=sim (docs/producao.md).')
}

if (!existsSync(REVISAO)) fail(`não achei ${REVISAO}. Rode npm run imagens:preparar.`)
const revisao = JSON.parse(readFileSync(REVISAO, 'utf8').replace(/^\uFEFF/, '')) // editores do Windows podem gravar BOM
const equipamentos = JSON.parse(readFileSync(env.EQUIPAMENTOS_ARQUIVO ?? join(RAIZ, 'scripts', 'dados-iniciais', 'equipamentos.json'), 'utf8'))

// CA-10: só envia com as 12 aprovadas pela revisão humana.
const pendentes = equipamentos.filter((e) => revisao[e.patrimonio]?.aprovada !== true).map((e) => e.patrimonio)
if (pendentes.length) fail(`fotos sem aprovação humana: ${pendentes.join(', ')}.`)
const ids = equipamentos.map((e) => String(revisao[e.patrimonio].source_id))
if (new Set(ids).size !== ids.length) fail('a mesma foto aparece em dois equipamentos (CA-05).')

const base = supaUrl.replace(/\/$/, '')
const auth = { apikey: serviceKey, Authorization: `Bearer ${serviceKey}` }
console.log(`imagens: destino ${remoto ? 'REMOTO' : 'local'}`)

// Bucket público (regra 6), criado só se não existir.
const b = await fetch(`${base}/storage/v1/bucket/${lib.BUCKET}`, { headers: auth })
if (!b.ok) {
  const c = await fetch(`${base}/storage/v1/bucket`, {
    method: 'POST',
    headers: { ...auth, 'Content-Type': 'application/json' },
    body: JSON.stringify({ id: lib.BUCKET, name: lib.BUCKET, public: true }),
  })
  if (!c.ok) fail(`não consegui criar o bucket ${lib.BUCKET} (HTTP ${c.status}). O Storage está ligado?`)
}

const pool = new pg.Pool({ connectionString: dbUrl })
try {
  for (const e of equipamentos) {
    const r = revisao[e.patrimonio]
    const arquivo = join(PASTA, lib.caminhoObjeto(e.patrimonio))
    if (!existsSync(arquivo)) fail(`falta ${arquivo}. Rode npm run imagens:preparar.`)
    const dados = readFileSync(arquivo)
    await lib.verificarDimensoes(dados) // CA-04, de novo, no envio

    const up = await fetch(`${base}/storage/v1/object/${lib.BUCKET}/${lib.caminhoObjeto(e.patrimonio)}`, {
      method: 'POST',
      headers: { ...auth, 'Content-Type': 'image/jpeg', 'x-upsert': 'true', 'cache-control': 'max-age=3600' },
      body: dados,
    })
    if (!up.ok) fail(`envio de ${e.patrimonio} falhou (HTTP ${up.status}).`)

    await pool.query(
      `update public.equipments
          set image_path = $2, image_source_id = $3, image_photographer = $4, image_source_url = $5, image_license = $6
        where patrimonio = $1`,
      [e.patrimonio, lib.caminhoObjeto(e.patrimonio), String(r.source_id), r.fotografo, r.source_url, r.licenca],
    )
  }
  const { rows } = await pool.query(
    `select count(*)::int as n from public.equipments where patrimonio like 'TI-%' and image_path is not null`,
  )
  console.log(`imagens: ${rows[0].n} equipamentos com foto no bucket ${lib.BUCKET}.`)
} finally {
  await pool.end()
}
