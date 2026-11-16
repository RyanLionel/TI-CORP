// Spec 002 · skill imagens-equipamentos · grava a escolha HUMANA entre os candidatos (revisão visual, CA-10).
// Uso: npm run imagens:escolher -- TI-0005=1234567 TI-0007=7654321
// A foto atual do patrimônio vai para o histórico (reprovadas) e a escolhida entra como aprovada.
import { copyFileSync, existsSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

const RAIZ = process.cwd()
const REVISAO = join(RAIZ, 'scripts', 'dados-iniciais', 'revisao-imagens.json')
const revisao = JSON.parse(readFileSync(REVISAO, 'utf8').replace(/^﻿/, ''))
const pares = process.argv.slice(2).map((a) => a.split('='))
if (!pares.length || pares.some(([p, id]) => !p || !id)) {
  console.error('imagens: uso: npm run imagens:escolher -- TI-0005=<id> ...')
  process.exit(1)
}

for (const [p, id] of pares) {
  const pasta = join(RAIZ, 'tmp', 'candidatos', p)
  const creditos = existsSync(join(pasta, 'candidatos.json')) ? JSON.parse(readFileSync(join(pasta, 'candidatos.json'), 'utf8')) : {}
  const credito = creditos[id]
  if (!credito) {
    console.error(`imagens: ${id} não é candidato de ${p} (rode imagens:candidatos antes).`)
    process.exit(1)
  }
  const emOutro = Object.entries(revisao).find(([q, r]) => q !== p && String(r.source_id) === String(id))
  if (emOutro) {
    console.error(`imagens: a foto ${id} já está em ${emOutro[0]} (CA-05).`)
    process.exit(1)
  }
  const atual = revisao[p]
  const historico = [...(atual?.reprovadas ?? [])]
  if (atual?.source_id && String(atual.source_id) !== String(id)) {
    historico.push({ source_id: atual.source_id, motivo: atual.motivo || 'substituída por escolha entre candidatos' })
  }
  copyFileSync(join(pasta, `${id}.jpg`), join(RAIZ, 'tmp', 'imagens', `${p}.jpg`))
  revisao[p] = { ...credito, aprovada: true, motivo: '', reprovadas: historico }
  console.log(`imagens: ${p} ← ${id} (${credito.fotografo}), aprovada pela escolha humana`)
}
writeFileSync(REVISAO, JSON.stringify(revisao, null, 2) + '\n')
