// Spec 002 · skill imagens-equipamentos · etapa 1: preparar (só Pixabay e disco local; não toca no Supabase).
// Saída: tmp/imagens/<patrimonio>.jpg (800x600) e o crédito em scripts/dados-iniciais/revisao-imagens.json.
import { createRequire } from 'node:module'
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

const require = createRequire(import.meta.url)
const lib = require('./lib.cjs')

try { process.loadEnvFile() } catch { /* sem .env: usa o ambiente */ }
const key = process.env.PIXABAY_API_KEY
if (!key) {
  console.error('imagens: PIXABAY_API_KEY não definida no .env (rules/secrets.md).')
  process.exit(1)
}

const RAIZ = process.cwd()
const PASTA = process.env.IMAGENS_DIR ?? join(RAIZ, 'tmp', 'imagens')
const REVISAO = process.env.REVISAO_ARQUIVO ?? join(RAIZ, 'scripts', 'dados-iniciais', 'revisao-imagens.json')
const equipamentos = JSON.parse(readFileSync(join(RAIZ, 'scripts', 'dados-iniciais', 'equipamentos.json'), 'utf8'))
const revisao = existsSync(REVISAO) ? JSON.parse(readFileSync(REVISAO, 'utf8')) : {}
mkdirSync(PASTA, { recursive: true })

const espera = (ms) => new Promise((r) => setTimeout(r, ms))

// Reprovadas: histórico + as marcadas agora como false (vão para o histórico e são trocadas).
const reprovadas = new Set()
for (const r of Object.values(revisao)) {
  for (const h of r.reprovadas ?? []) reprovadas.add(String(h.source_id))
  if (r.aprovada === false && r.source_id) reprovadas.add(String(r.source_id))
}

let trocadas = 0
for (const e of equipamentos) {
  const atual = revisao[e.patrimonio]
  const arquivo = join(PASTA, lib.caminhoObjeto(e.patrimonio))
  if (atual && atual.aprovada !== false && existsSync(arquivo)) continue // já preparada e não reprovada

  const historico = [...(atual?.reprovadas ?? [])]
  if (atual?.aprovada === false) historico.push({ source_id: atual.source_id, motivo: atual.motivo ?? '' })

  const usadas = new Set(
    Object.entries(revisao)
      .filter(([p, r]) => p !== e.patrimonio && r.source_id)
      .map(([, r]) => String(r.source_id)),
  )

  const res = await fetch(lib.urlBusca(key, e.busca))
  if (!res.ok) {
    console.error(`imagens: busca no Pixabay falhou para ${e.patrimonio} (HTTP ${res.status}).`)
    process.exit(1)
  }
  const { hits = [] } = await res.json()
  const hit = lib.escolher(hits, { usadas, reprovadas })
  if (!hit) {
    console.error(`imagens: nenhum candidato válido para ${e.patrimonio} ("${e.busca}"). Ajuste o termo de busca.`)
    process.exit(1)
  }

  const original = Buffer.from(await (await fetch(hit.largeImageURL)).arrayBuffer())
  const pronta = await lib.normalizar(original)
  await lib.verificarDimensoes(pronta)
  writeFileSync(arquivo, pronta)

  revisao[e.patrimonio] = { ...lib.credito(hit), aprovada: null, motivo: '', reprovadas: historico }
  trocadas++
  console.log(`imagens: ${e.patrimonio} ← Pixabay ${hit.id} (${hit.user})`)
  await espera(700) // limite da API: 100 req/min
}

writeFileSync(REVISAO, JSON.stringify(revisao, null, 2) + '\n')
const pendentes = equipamentos.filter((e) => revisao[e.patrimonio]?.aprovada !== true).map((e) => e.patrimonio)
console.log(`imagens: ${trocadas} preparada(s). Pendentes de revisão humana: ${pendentes.length ? pendentes.join(', ') : 'nenhuma'}.`)
if (pendentes.length) console.log(`imagens: abra ${PASTA} e marque "aprovada" (true/false + motivo) em ${REVISAO}.`)
