// Spec 003 · gatilho do verificador: roda o script num repositório git temporário.
import { execFileSync } from 'node:child_process'
import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

const SCRIPT = join(__dirname, '..', '..', 'scripts', 'checar-specs.mjs')

function repo() {
  const dir = mkdtempSync(join(tmpdir(), 'checar-specs-'))
  const git = (...a: string[]) => execFileSync('git', a, { cwd: dir, encoding: 'utf8', stdio: 'pipe' }).trim()
  git('init', '-q')
  git('config', 'user.email', 'teste@exemplo.local')
  git('config', 'user.name', 'Teste')
  git('config', 'core.autocrlf', 'false')
  const escrever = (rel: string, txt: string) => {
    mkdirSync(join(dir, rel, '..'), { recursive: true })
    writeFileSync(join(dir, rel), txt)
  }
  const commit = (msg: string) => {
    git('add', '-A')
    git('commit', '-q', '-m', msg)
    return git('rev-parse', 'HEAD')
  }
  const checar = () => {
    try {
      return { ok: true, saida: execFileSync(process.execPath, [SCRIPT], { cwd: dir, encoding: 'utf8', stdio: 'pipe' }) }
    } catch (e) {
      return { ok: false, saida: String((e as { stderr?: string }).stderr ?? e) }
    }
  }
  return { escrever, commit, checar }
}

const spec = (status: string) => `# Spec X\n\n> Status: ${status}\n`
const rodada = (veredito: string, sha: string) => `Commit: ${sha}\n\nVeredito: ${veredito} — teste\n`

describe('gatilho obrigatório do verificador (spec 003)', () => {
  it('CA-01: spec em rascunho passa', () => {
    const r = repo()
    r.escrever('docs/specs/001-x/spec.md', spec('rascunho'))
    r.commit('inicial')
    expect(r.checar().ok).toBe(true)
  })

  it('CA-02: spec pronta sem rodada é barrada', () => {
    const r = repo()
    r.escrever('docs/specs/001-x/spec.md', spec('pronta'))
    r.commit('inicial')
    const res = r.checar()
    expect(res.ok).toBe(false)
    expect(res.saida).toMatch(/sem nenhuma rodada/)
  })

  it('CA-03: última rodada NÃO PRONTA barra (mesmo com uma PRONTA antes)', () => {
    const r = repo()
    r.escrever('src/a.ts', 'export const a = 1\n')
    const sha = r.commit('codigo')
    r.escrever('docs/specs/001-x/spec.md', spec('pronta'))
    r.escrever('docs/specs/001-x/verificacoes/rodada-01.md', rodada('PRONTA', sha))
    r.escrever('docs/specs/001-x/verificacoes/rodada-02.md', rodada('NÃO PRONTA', sha))
    r.commit('rodadas')
    const res = r.checar()
    expect(res.ok).toBe(false)
    expect(res.saida).toMatch(/rodada-02\.md.*Veredito: PRONTA/)
  })

  it('CA-04: rodada PRONTA do commit atual passa', () => {
    const r = repo()
    r.escrever('src/a.ts', 'export const a = 1\n')
    const sha = r.commit('codigo')
    r.escrever('docs/specs/001-x/spec.md', spec('pronta'))
    r.escrever('docs/specs/001-x/verificacoes/rodada-01.md', rodada('PRONTA', sha))
    r.commit('rodada')
    const res = r.checar()
    expect(res.ok).toBe(true)
    expect(res.saida).toMatch(/1 spec\(s\) pronta/)
  })

  it('CA-05: código alterado depois da verificação barra (inclusive antes de commitar)', () => {
    const r = repo()
    r.escrever('src/a.ts', 'export const a = 1\n')
    const sha = r.commit('codigo')
    r.escrever('docs/specs/001-x/spec.md', spec('pronta'))
    r.escrever('docs/specs/001-x/verificacoes/rodada-01.md', rodada('PRONTA', sha))
    r.commit('rodada')
    r.escrever('src/a.ts', 'export const a = 2\n')
    const res = r.checar()
    expect(res.ok).toBe(false)
    expect(res.saida).toMatch(/código mudou depois.*src\/a\.ts/)
  })
})
