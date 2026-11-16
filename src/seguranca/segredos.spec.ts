// Spec 002 · CA-09: nenhuma senha, token ou chave no repositório nem no histórico do git.
// Varre o conteúdo versionado (git grep no HEAD) e todo o histórico (git log -p --all).
// Permitido: a credencial padrão do Postgres LOCAL (postgres:postgres@127.0.0.1) e placeholders do .env.example.
import { execFileSync } from 'node:child_process'
import { join } from 'node:path'

const RAIZ = join(__dirname, '..', '..')
const git = (...args: string[]) =>
  execFileSync('git', args, { cwd: RAIZ, encoding: 'utf8', maxBuffer: 256 * 1024 * 1024 })

const PADROES: [string, RegExp][] = [
  // a senha do briefing é montada em pedaços para este arquivo não casar com o próprio padrão
  ['senha padrão da turma (briefing)', new RegExp(['Inovacao', '2026'].join(''))],
  ['JWT (chave anon/service_role ou token)', /eyJ[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{10,}/],
  ['chave secreta nova do Supabase', /sb_secret_[A-Za-z0-9_-]{10,}/],
  ['chave da API do Pixabay', /\b\d{7,9}-[0-9a-f]{25}\b/],
  ['variável de segredo com valor', /(SERVICE_ROLE_KEY|ANON_KEY|PIXABAY_API_KEY|SEED_PROFESSOR_PASSWORD)\s*=\s*"[^"<]+"/],
  ['URL de banco com senha que não é a local', /postgres(?:ql)?:\/\/[^:\s/]+:(?!postgres@|<PASSWORD>@)[^@\s]+@/],
]

function achados(texto: string): string[] {
  return PADROES.filter(([, re]) => re.test(texto)).map(([nome]) => nome)
}

describe('segredos no repositório (spec 002)', () => {
  it('CA-09: nenhum arquivo versionado no HEAD contém senha, token ou chave', () => {
    const arquivos = git('ls-files').split('\n').filter(Boolean)
    const problemas: string[] = []
    for (const f of arquivos) {
      if (/\.(png|jpe?g|gif|ico|woff2?)$/i.test(f) || f === 'package-lock.json') continue
      const conteudo = git('show', `HEAD:${f}`)
      for (const nome of achados(conteudo)) problemas.push(`${f}: ${nome}`)
    }
    expect(problemas).toEqual([])
  })

  it('CA-09: nenhum commit do histórico adicionou senha, token ou chave', () => {
    const adicionadas = git('log', '-p', '--all', '--no-color', '--', '.', ':(exclude)package-lock.json')
      .split('\n')
      .filter((l) => l.startsWith('+') && !l.startsWith('+++'))
      .join('\n')
    expect(achados(adicionadas)).toEqual([])
  })

  it('CA-09: .env não é versionado (só .env.example)', () => {
    const envs = git('ls-files').split('\n').filter((f) => /(^|\/)\.env/.test(f))
    expect(envs).toEqual(['.env.example'])
  })
})
