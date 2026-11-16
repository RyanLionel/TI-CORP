> Rodada 1 · resposta literal do subagente verificador-spec, aberto como agente novo, sem o contexto da sessão principal (plano B da aula 11).
> Adaptação de harness (2026-11-16): os checks foram executados pelo Ryan no HEAD e entregues ao subagente como evidência; ele leu código e testes só em modo leitura.

Spec: docs/specs/004-deploy-vercel/spec.md · Rodada: 1 · Commit: 9cd74fca2f61bdb55bfb56a55e50d7caaec0dce1 · Árvore: limpa

| CA | evidência (arquivo:linha do teste) | status | observação |
|---|---|---|---|
| CA-01 | test/vercel-handler.e2e-spec.ts:17-21 | ATENDIDO | Exercita api/index.ts:24-28, que é o handler sem `listen`. Esse handler sobe o Nest com `app.init()` e entrega a requisição ao Express. O teste espera status 200 e o corpo `{status:"ok",database:"up"}`, e src/health/health.controller.ts:12 devolve exatamente isso. O banco usado é o LOCAL (127.0.0.1:54322), definido à força na linha 9. |
| CA-02 | test/vercel-handler.e2e-spec.ts:23-27 | ATENDIDO | Faz `GET /equipments` pelo handler e confere status 401 e a mensagem "Autenticação obrigatória". A rota é protegida por `@UseGuards(SupabaseAuthGuard)` em src/equipments/equipments.controller.ts:6, e a mensagem vem de src/auth/supabase-auth.guard.ts:20. O `vercel.json` reescreve `/(.*)` para `/api`, conforme a regra 1. |
| CA-03 | — | SEM TESTE | Precisa de conferência humana no link de produção depois do deploy, que ainda não foi feito. A tarefa T3 de tasks.md segue em aberto. Pela spec, este CA não tem teste automatizado. |

Checks: `npm test` → passou (rodado pelo humano no HEAD 9cd74fc, não aqui: Test Suites 10 passed, 10 total / Tests 60 passed, 60 total; inclui test/vercel-handler.e2e-spec.ts)
Checks: `npm run build` → passou (rodado pelo humano no HEAD 9cd74fc, sem erro)
Checks: `git status --short` → passou (vazio pelo relato do humano; conferido aqui também: vazio)
Fora de escopo: nada encontrado. Não há CI de deploy (sem .github/ nem workflow), nem domínio próprio, nem configuração de regiões no vercel.json. A mudança em prisma.config.ts (prisma generate sem variável obrigatória) e a inclusão de `api` em tsconfig.json estão previstas no ADR-003 e na tarefa T1, então não são excesso. O repositório não guarda nenhum valor das quatro variáveis do ADR-003: o .env.example só tem placeholders e o teste usa a URL do banco local.
Veredito: NÃO PRONTA — CA-01 e CA-02 estão atendidos, mas o CA-03 depende do deploy e da conferência humana de `GET /health` no link de produção, e isso ainda não foi feito.
