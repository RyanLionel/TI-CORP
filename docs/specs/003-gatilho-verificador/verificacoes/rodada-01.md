> Rodada 1 · resposta literal do subagente verificador-spec, aberto como agente novo, sem o contexto da sessão principal (plano B da aula 11).
> Adaptação de harness (2026-11-16): os checks foram executados pelo Ryan no HEAD e entregues ao subagente como evidência; ele leu código e testes só em modo leitura.

Spec: docs/specs/003-gatilho-verificador/spec.md · Rodada: 1 · Commit: 9cd74fca2f61bdb55bfb56a55e50d7caaec0dce1 · Árvore: limpa

| CA | evidência (arquivo:linha do teste) | status | observação |
|---|---|---|---|
| CA-01 | src/specs/checar-specs.spec.ts:39 | ATENDIDO | Uma spec em rascunho passa: scripts/checar-specs.mjs:20 pula toda spec que não tem `> Status: pronta`. |
| CA-02 | src/specs/checar-specs.spec.ts:46 | ATENDIDO | Uma spec pronta sem nenhuma rodada é barrada em scripts/checar-specs.mjs:30-32. |
| CA-03 | src/specs/checar-specs.spec.ts:55 | ATENDIDO | Só a última rodada vale, ordenada pelo número em scripts/checar-specs.mjs:26-28,34. Uma rodada sem `Veredito: PRONTA` barra (linhas 36-38). O teste também cobre uma rodada PRONTA anterior seguida de uma NÃO PRONTA. |
| CA-04 | src/specs/checar-specs.spec.ts:68 | ATENDIDO | Uma rodada PRONTA cujo commit existe e sem diff de código depois dele passa (scripts/checar-specs.mjs:40-56,64). |
| CA-05 | src/specs/checar-specs.spec.ts:80 | ATENDIDO | O script roda `git diff --name-only <sha> -- src test api supabase scripts skills prisma` (scripts/checar-specs.mjs:10,52), o que cobre também mudança ainda não commitada (Regra 2). O teste só exercita a mudança não commitada; a mudança já commitada passa pelo mesmo `git diff` e não tem teste próprio. Arquivo novo ainda não adicionado ao índice não entra no `git diff`. Isso não afeta o pre-commit, porque arquivo fora do índice não vai para o commit. |

Checks: não rodei os comandos (Docker e binários do Windows não estão disponíveis aqui); as linhas abaixo usam a saída informada pelo humano no HEAD 9cd74fc.
Checks: `npm test` → passou (Test Suites: 10 passed, 10 total / Tests: 60 passed, 60 total, inclui src/specs/checar-specs.spec.ts; resultado informado pelo humano)
Checks: `npm run build` → passou (sem erro; resultado informado pelo humano)
Checks: `git status --short` → passou (vazio; informado pelo humano e confirmado aqui com `git status` em modo leitura)
Checks: pre-commit `check:specs` → passou ("check:specs: ok (0 spec(s) pronta(s) com rodada PRONTA válida)"; resultado informado pelo humano). Confirmei em modo leitura: `.githooks/pre-commit` chama o script, `postinstall` e `check:specs` estão em package.json:13,22, e `git config --get core.hooksPath` = `.githooks`.
Fora de escopo: nada encontrado. Os commits 71a561d e df30cc3 só tocam no script, no hook, no package.json, no teste, no rules/spec-flow.md, na cópia do agente e nos docs; não há CI remoto nem bloqueio de `--no-verify`. Há documentação desatualizada, que não é código fora de escopo: AGENTS.md ("Estado atual") e o cabeçalho de spec.md/tasks.md ainda dizem que scripts/checar-specs e .githooks/ não existem, e tasks.md cita 59 testes (hoje são 60).
Veredito: PRONTA — os cinco CAs têm teste que cita o ID e passa no HEAD 9cd74fc, segundo a execução do humano, e não há código fora de escopo.
