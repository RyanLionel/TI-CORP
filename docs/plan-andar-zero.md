# Plano — andar zero

Isto não é feature. Prova que a stack do ADR-001 sobe junta, pelos critérios de `docs/andar-zero.md`.

## Organização de pastas proposta

- `src/<recurso>/` — módulo NestJS do recurso (controller na borda, serviço com a regra).
- `src/config/` — leitura de variável de ambiente.
- `test/` — testes de ponta a ponta.
- `supabase/migrations/` — schema versionado.
- `prisma/` — schema derivado do banco (`npm run db:pull`), não editado à mão.
- Front em outro repositório: a página que mostra `GET /health`.

Por que essa e não outra: é a convenção de módulos do NestJS, framework fechado no ADR-001. Uma pasta por recurso deixa a regra de uma feature em dois ou três lugares, sem inventar camada própria.

## Tarefas

- [x] T1 · Banco local pela Supabase CLI
      atende: AZ-01
      verifico assim: `npm run db:up` sobe o Postgres e aceita conexão

- [x] T2 · Projeto NestJS sem rota de produto
      atende: pré-requisito de T3
      verifico assim: `npm run build` gera `dist/main.js`

- [x] T3 · `GET /health` com status da conexão
      atende: AZ-04
      verifico assim: com banco, 200 `{status:"ok",database:"up"}`; sem banco, 503

- [x] T4 · Conexão lida de variável de ambiente
      atende: AZ-02, AZ-07
      verifico assim: sem `DATABASE_URL` a API falha na subida com mensagem clara; `.env.example` está versionado

- [x] T5 · Migration inicial
      atende: AZ-03
      verifico assim: `supabase db reset` aplica do zero e cria as tabelas com RLS

- [x] T6 · Página do front mostra o resultado de `/health`
      atende: AZ-05
      verifico assim: a página do repo front carrega e exibe status e banco

- [x] T7 · Suíte com teste do health
      atende: AZ-06
      verifico assim: `npm test` passa e `test/health.e2e-spec.ts` exercita AZ-04

- [x] T8 · `.env` fora do git
      atende: AZ-08
      verifico assim: `.env` está no `.gitignore` e `git ls-files` só lista `.env.example`
