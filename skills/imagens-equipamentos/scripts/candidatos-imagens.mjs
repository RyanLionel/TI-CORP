// Spec 002 · skill imagens-equipamentos · modo candidatos (para itens difíceis):
// baixa até 8 opções válidas por patrimônio em tmp/candidatos/<patrimonio>/, já em 800x600, para o humano escolher.
// Uso: npm run imagens:candidatos -- TI-0005 TI-0007
import { createRequire } from 'node:module'
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
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
const MAX = 8
const REVISAO = join(RAIZ, 'scripts', 'dados-iniciais', 'revisao-imagens.json')
const equipamentos = JSON.parse(readFileSync(join(RAIZ, 'scripts', 'dados-iniciais', 'equipamentos.json'), 'utf8'))
const revisao = existsSync(REVISAO) ? JSON.parse(readFileSync(REVISAO, 'utf8').replace(/^﻿/, '')) : {}
const alvos = process.argv.slice(2)
if (!alvos.length) {
  console.error('imagens: diga os patrimônios, ex.: npm run imagens:candidatos -- TI-0005 TI-0007')
  process.exit(1)
}

const reprovadas = new Set()
for (const r of Object.values(revisao)) {
  for (const h of r.reprovadas ?? []) reprovadas.add(String(h.source_id))
  if (r.aprovada === false && r.source_id) reprovadas.add(String(r.source_id))
}

for (const p of alvos) {
  const e = equipamentos.find((x) => x.patrimonio === p)
  if (!e) {
    console.error(`imagens: ${p} não está em equipamentos.json.`)
    process.exit(1)
  }
  const usadas = new Set(
    Object.entries(revisao)
      .filter(([q, r]) => q !== p && r.source_id)
      .map(([, r]) => String(r.source_id)),
  )
  const res = await fetch(lib.urlBusca(key, e.busca))
  if (!res.ok) {
    console.error(`imagens: busca falhou para ${p} (HTTP ${res.status}).`)
    process.exit(1)
  }
  const { hits = [] } = await res.json()
  const lista = lib.filtrar(hits, { usadas, reprovadas }, MAX)
  const pasta = join(RAIZ, 'tmp', 'candidatos', p)
  rmSync(pasta, { recursive: true, force: true })
  mkdirSync(pasta, { recursive: true })
  const creditos = {}
  for (const hit of lista) {
    const pronta = await lib.normalizar(Buffer.from(await (await fetch(hit.largeImageURL)).arrayBuffer()))
    await lib.verificarDimensoes(pronta)
    writeFileSync(join(pasta, `${hit.id}.jpg`), pronta)
    creditos[hit.id] = lib.credito(hit)
  }
  writeFileSync(join(pasta, 'candidatos.json'), JSON.stringify(creditos, null, 2) + '\n')
  console.log(`imagens: ${p} ("${e.busca}") → ${lista.length} candidato(s) em tmp/candidatos/${p}/`)
  await new Promise((r) => setTimeout(r, 700)) // limite da API
}
console.log('imagens: escolha com  npm run imagens:escolher -- TI-0005=<id> ...')
