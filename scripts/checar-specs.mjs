// Spec 003 · gatilho obrigatório do verificador (rules/spec-flow.md, passo 6).
// Spec com "> Status: pronta" exige a última verificacoes/rodada-NN.md com "Veredito: PRONTA" e "Commit: <sha>",
// e nenhum arquivo de código mudado depois desse commit. Spec em rascunho passa.
// Uso: npm run check:specs   (também roda no pre-commit, via .githooks/pre-commit)
import { execFileSync } from 'node:child_process'
import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

const RAIZ = process.cwd()
const CODIGO = ['src', 'test', 'api', 'supabase', 'scripts', 'skills', 'prisma']
const git = (...args) => execFileSync('git', args, { cwd: RAIZ, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] })

const pasta = join(RAIZ, 'docs', 'specs')
const problemas = []
let prontas = 0

for (const spec of existsSync(pasta) ? readdirSync(pasta).sort() : []) {
  const arquivo = join(pasta, spec, 'spec.md')
  if (!existsSync(arquivo)) continue
  if (!/^>\s*Status:\s*pronta\b/im.test(readFileSync(arquivo, 'utf8'))) continue // rascunho passa (CA-01)
  prontas++

  const dirRodadas = join(pasta, spec, 'verificacoes')
  const rodadas = existsSync(dirRodadas)
    ? readdirSync(dirRodadas)
        .map((f) => ({ f, n: Number(/^rodada-(\d+)\.md$/.exec(f)?.[1]) }))
        .filter((r) => Number.isInteger(r.n))
        .sort((a, b) => a.n - b.n)
    : []
  if (!rodadas.length) {
    problemas.push(`${spec}: marcada pronta sem nenhuma rodada do verificador (CA-02)`)
    continue
  }
  const ultima = rodadas[rodadas.length - 1].f
  const texto = readFileSync(join(dirRodadas, ultima), 'utf8')
  if (!/Veredito:\s*PRONTA\b/.test(texto)) {
    problemas.push(`${spec}: a última rodada (${ultima}) não tem "Veredito: PRONTA" (CA-03)`)
    continue
  }
  const sha = /Commit:\s*([0-9a-f]{7,40})/i.exec(texto)?.[1]
  if (!sha) {
    problemas.push(`${spec}: a última rodada (${ultima}) não diz o commit verificado ("Commit: <sha>")`)
    continue
  }
  try {
    git('cat-file', '-e', `${sha}^{commit}`)
  } catch {
    problemas.push(`${spec}: o commit ${sha} da ${ultima} não existe neste repositório`)
    continue
  }
  // Inclui mudanças ainda não commitadas (staged ou não): o pre-commit também precisa barrar.
  const mudados = git('diff', '--name-only', sha, '--', ...CODIGO).split('\n').filter(Boolean)
  if (mudados.length) {
    problemas.push(`${spec}: código mudou depois do commit verificado ${sha.slice(0, 7)} (CA-05): ${mudados.slice(0, 5).join(', ')}${mudados.length > 5 ? '…' : ''}`)
  }
}

if (problemas.length) {
  console.error('check:specs: spec pronta sem verificação válida (rules/spec-flow.md):')
  for (const p of problemas) console.error(`  - ${p}`)
  console.error('Rode o subagente verificador-spec e salve a rodada, ou volte o status para rascunho.')
  process.exit(1)
}
console.log(`check:specs: ok (${prontas} spec(s) pronta(s) com rodada PRONTA válida)`)
