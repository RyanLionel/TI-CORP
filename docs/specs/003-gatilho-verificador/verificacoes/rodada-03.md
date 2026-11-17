> Rodada 3 · resposta literal do subagente verificador-spec, aberto como agente novo, sem o contexto da sessão principal (plano B da aula 11).
> Adaptação de harness (2026-11-17): os checks foram executados pelo Ryan no HEAD e entregues ao subagente como evidência; ele leu código e testes só em modo leitura.
> O subagente não escreveu a linha de cabeçalho; ela foi completada pela sessão principal com os dados que ele mesmo conferiu (HEAD fe3fde1…, árvore vazia).

Spec: docs/specs/003-gatilho-verificador/spec.md · Rodada: 3 · Commit: fe3fde1ffcf7eb04302806b4ca9412b1e798c01f · Árvore: limpa

| CA | evidência (arquivo:linha do teste) | status | observação |
|---|---|---|---|
| CA-01 | src/specs/checar-specs.spec.ts:39 | ATENDIDO | `scripts/checar-specs.mjs:20`: spec sem `Status: pronta` é pulada. Neste HEAD o script rodou de verdade com as specs em rascunho e terminou com rc=0. |
| CA-02 | src/specs/checar-specs.spec.ts:46 | ATENDIDO | `scripts/checar-specs.mjs:30-33`: sem rodadas, registra o problema "sem nenhuma rodada" e sai com exit 1. |
| CA-03 | src/specs/checar-specs.spec.ts:55 | ATENDIDO | `scripts/checar-specs.mjs:34-39`: lê só a última rodada (ordenada pelo número) e exige `Veredito: PRONTA`. O teste cobre o caso de uma rodada PRONTA anterior. |
| CA-04 | src/specs/checar-specs.spec.ts:68 | ATENDIDO | `scripts/checar-specs.mjs:40-55,64`: o sha existe e não há diff de código, então imprime "ok (N spec(s) pronta(s)…)" e sai com 0. |
| CA-05 | src/specs/checar-specs.spec.ts:80 | ATENDIDO | `scripts/checar-specs.mjs:10,52-55`: faz `git diff --name-only <sha> -- src test api supabase scripts skills prisma` contra a árvore de trabalho, e por isso pega também mudança não commitada. Regra 3: `.githooks/pre-commit:3`, `package.json:13` (postinstall define core.hooksPath), `package.json:22` (check:specs). Neste repo `core.hooksPath` vale `.githooks`. |

Checks: git rev-parse HEAD → passou (fe3fde1ffcf7eb04302806b4ca9412b1e798c01f, igual ao esperado)
Checks: npm run db:reset; npm test → passou (12 suítes, 71 testes; execução do humano, aceita como evidência pela adaptação de harness)
Checks: npm run build → passou (execução do humano)
Checks: git -c core.autocrlf=true status --short → passou (vazio)
Checks: node scripts/checar-specs.mjs → passou (rc=0, "0 spec(s) pronta(s)")
Checks: git diff --name-only 6fa1438 HEAD → passou (scripts/, .githooks/, src/specs/ e package.json sem mudança desde a rodada 02; os arquivos de código mudados, src/loans e test/devolver.e2e-spec.ts, são da spec 005)
Fora de escopo: nada encontrado (não há .github/ nem CI remoto, e nenhum bloqueio de `--no-verify`)
Veredito: PRONTA — os cinco CAs têm teste que cita o ID, o código que esses testes exercitam não mudou desde 6fa1438, e os checks passam no commit fe3fde1.
