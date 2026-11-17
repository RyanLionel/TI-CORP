> Rodada 1 · resposta literal do subagente verificador-spec, aberto como agente novo, sem o contexto da sessão principal (plano B da aula 11).
> Adaptação de harness (2026-11-17): os checks foram executados pelo Ryan no HEAD e entregues ao subagente como evidência; ele leu código e testes só em modo leitura.

Spec: docs/specs/005-devolver-emprestimo/spec.md · Rodada: 1 · Commit: fe3fde1ffcf7eb04302806b4ca9412b1e798c01f · Árvore: limpa (`git -c core.autocrlf=true status --short` vazio)

| CA | evidência (arquivo:linha do teste) | status | observação |
|---|---|---|---|
| CA-01 | test/devolver.e2e-spec.ts:84 | ATENDIDO | Verifica 200, `id` e `returnedAt` em ISO, e no banco `returned_at` não nulo e `returned_by` igual a quem devolveu. O código está em src/loans/loans.controller.ts:24-29 e src/loans/loans.service.ts:62-74 (`return_loan` chamada com `asUser`). |
| CA-02 | test/devolver.e2e-spec.ts:96 | ATENDIDO | O empréstimo some de `GET /loans/me`, o equipamento aparece com `situacao` `disponivel` em `GET /equipments` e um novo pedido dá 201. |
| CA-03 | test/devolver.e2e-spec.ts:108 | REPROVADO | O teste cobre só colaborador comum devolvendo empréstimo de outro (403 + mensagem, `returned_at` continua nulo). A rota não confere se quem chama é o dono: só repassa para `public.return_loan` (supabase/migrations/20261001000000_initial_schema.sql:226), que deixa passar `is_operations()`. Um usuário de Operações recebe 200 ao devolver empréstimo de outra pessoa, contra a regra 2 ("Só quem pegou o empréstimo pode devolvê-lo por esta rota") e contra o CA-03. Falta checar o dono na rota e um teste com usuário de Operações. |
| CA-04 | test/devolver.e2e-spec.ts:119 | ATENDIDO | 409 "Empréstimo já devolvido", com status e corpo conferidos. Mapeamento em src/loans/loans.service.ts:38. |
| CA-05 | test/devolver.e2e-spec.ts:128 | ATENDIDO | 404 "Empréstimo não encontrado" e 400 "id deve ser um UUID" (src/loans/loans.controller.ts:27, src/loans/loans.service.ts:37). |
| CA-06 | test/devolver.e2e-spec.ts:138 | ATENDIDO | 401 sem token e com token inválido. A rota usa o mesmo `SupabaseAuthGuard` no nível do controller (src/loans/loans.controller.ts:11). O teste confere só o status, não o corpo `{ message }`. |
| CA-07 | test/devolver.e2e-spec.ts:145 | ATENDIDO | Com 5 em aberto, o 6º pedido dá 409. Depois de devolver 1, o novo pedido dá 201. |

Checks: `npm run db:reset; npm test` → passou (12 suítes e 71 testes passaram, incluindo test/devolver.e2e-spec.ts; o humano rodou no HEAD fe3fde1 e eu não rodei de novo, por estar em modo só leitura)
Checks: `npm run build` → passou (rodado pelo humano no mesmo HEAD)
Checks: `git status --short` → passou (vazio)
Fora de escopo: `POST /loans/:id/return` deixa um usuário de Operações devolver empréstimo de outra pessoa (src/loans/loans.controller.ts:24-29 e src/loans/loans.service.ts:62-74 não conferem o dono; quem decide é `return_loan`, que aceita Operações). Isso é, na prática, a "devolução no balcão" que a spec põe fora de escopo, e contraria a regra 2.
Veredito: NÃO PRONTA — a rota deixa Operações devolver empréstimo de outra pessoa, contra a regra 2 e o CA-03, e nenhum teste cobre esse caso.
