> Rodada 4 · depois de desfazer o erro plantado (revert 273313f do commit 5f6bfb8). Resposta literal do subagente verificador-spec, aberto como agente novo, sem o contexto da sessão principal (plano B da aula 11).
> Adaptação de harness (2026-11-16): os checks foram executados pelo Ryan no HEAD, depois de `npm run db:reset`, e entregues ao subagente como evidência; ele leu código e testes só em modo leitura.
> O veredito PRONTA vale para o lado do back. A spec só é marcada "pronta" quando o CA-11 for verificado no repo front e a T7 (deploy e conferência em produção) estiver feita.

Spec: docs/specs/001-solicitar-emprestimo/spec.md · Rodada: 4 · Commit: 273313f6f60e8955faf658decac4ee20445b715a · Árvore: limpa

| CA | evidência (arquivo:linha do teste) | status | observação |
|---|---|---|---|
| CA-01 | test/loans.e2e-spec.ts:83, :90, :99; test/loans-api.e2e-spec.ts:140 | ATENDIDO | `request_loan` grava `auth.uid()` e `add_business_days(now(), 14)` (supabase/migrations/20261116134500_regras_solicitar_emprestimo.sql:84-85). Os dias úteis são contados no fuso America/Sao_Paulo (:18). |
| CA-02 | test/loans.e2e-spec.ts:113; test/loans-api.e2e-spec.ts:152 | ATENDIDO | A situação é calculada no servidor (src/equipments/equipments.service.ts:146-150). |
| CA-03 | test/loans.e2e-spec.ts:124; test/loans-api.e2e-spec.ts:165 | ATENDIDO | O trigger `enforce_loan_rules` recusa com 'Equipamento em manutenção' (migration :41-42). A API transforma a recusa em 409 (src/loans/loans.service.ts:49-50). |
| CA-04 | test/loans.e2e-spec.ts:131; test/loans-api.e2e-spec.ts:172 | ATENDIDO | O trigger recusa com 'Equipamento já emprestado' (migration :44-46). |
| CA-05 | test/loans.e2e-spec.ts:140; test/loans-api.e2e-spec.ts:180 | ATENDIDO | O limite voltou para `>= 5` (migration :63). O revert 273313f desfez o erro plantado em 5f6bfb8. `git diff df30cc3 HEAD` só mostra a rodada-03.md, então supabase/, src/ e test/ estão iguais a antes do erro plantado. |
| CA-06 | test/loans.e2e-spec.ts:148, :161; test/loans-api.e2e-spec.ts:189 | ATENDIDO | O trigger recusa quando há `due_at < now()` sem devolução (migration :54-58). Pela decisão de 2026-11-16, essa checagem vem depois das checagens do equipamento. |
| CA-07 | test/loans.e2e-spec.ts:168 | ATENDIDO | No banco, o índice único `loans_one_open_per_equipment` e o `for update` no equipamento garantem 1 só empréstimo. A tradução de 23505 para 409 na API (src/loans/loans.service.ts:31) não tem teste via HTTP. |
| CA-08 | test/loans.e2e-spec.ts:180, :188, :196; test/loans-api.e2e-spec.ts:93, :99 | ATENDIDO | O guard src/auth/supabase-auth.guard.ts valida o token em `/auth/v1/user`. O `request_loan` não pode ser executado por `anon` (initial_schema.sql:301). |
| CA-09 | test/loans.e2e-spec.ts:210, :220, :230 | ATENDIDO | Testes de RLS sem banco mocado, como pede rules/tests.md regra 5. A policy `loans_read_borrower_or_operations` não foi alterada: o único commit que tocou a migration inicial é 32d489d. |
| CA-10 | test/loans-api.e2e-spec.ts:107, :121, :140, :159, :165, :172, :180, :189, :202 | ATENDIDO | Os testes cobrem 400, 401, 409, 201 e o formato de `imagem`. Duas lacunas sem falha: (1) nenhum teste cria um empréstimo devolvido, então o filtro "só em aberto" de `GET /loans/me` (loans.service.ts:60) não é exercitado; (2) `GET /equipments` consulta o banco sem `asUser` (equipments.service.ts:118), e o contrato diz que "a chamada ao banco roda como o usuário". O plan.md, item 3, justifica isso. |
| CA-11 | — | OUTRO REPOSITÓRIO | A prova fica no repo TI-CORP-frontend (spec 001 de lá, commit e4ed174 do front). Precisa ser verificada lá. |

Checks: `npm test` → passou (executado pelo humano no HEAD 273313f, depois de `npm run db:reset`, e entregue como evidência: "Test Suites: 10 passed, 10 total; Tests: 59 passed, 59 total")
Checks: `npm run build` → passou (executado pelo humano e entregue como evidência: tsc -p tsconfig.build.json sem mensagens)
Checks: `git status --short` → passou (executado pelo humano e entregue como evidência: vazio; `git rev-parse HEAD` = 273313f6f60e8955faf658decac4ee20445b715a, que também conferi aqui, só em modo leitura)
Fora de escopo: nada encontrado (não há endpoint de devolução, renovação, reserva, aprovação ou e-mail; os controllers são só health, loans e equipments). Observação menor: o trigger e o `RULE_MESSAGES` (src/loans/loans.service.ts:10) têm uma recusa 409 'Equipamento não encontrado', que não está entre os motivos da regra 7.
Veredito: PRONTA — os CA-01 a CA-10 têm testes que os citam e passam no HEAD 273313f, e o CA-11 fica para conferir no repositório do front.
