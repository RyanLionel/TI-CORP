> Rodada 5 · resposta literal do subagente verificador-spec, aberto como agente novo, sem o contexto da sessão principal (plano B da aula 11).
> Adaptação de harness (2026-11-16): os checks foram executados pelo Ryan no HEAD e entregues ao subagente como evidência; ele leu código e testes só em modo leitura.

Spec: docs/specs/001-solicitar-emprestimo/spec.md · Rodada: 5 · Commit: 9cd74fca2f61bdb55bfb56a55e50d7caaec0dce1 · Árvore: limpa

| CA | evidência (arquivo:linha do teste) | status | observação |
|---|---|---|---|
| CA-01 | test/loans.e2e-spec.ts:83, :90, :99; test/loans-api.e2e-spec.ts:140 | ATENDIDO | `request_loan` grava o empréstimo com `auth.uid()` e `add_business_days(now(), 14)` (supabase/migrations/20261116134500_regras_solicitar_emprestimo.sql:84-85). Os dias úteis são contados no fuso America/Sao_Paulo (:18). |
| CA-02 | test/loans.e2e-spec.ts:113; test/loans-api.e2e-spec.ts:152 | ATENDIDO | A `situacao` é calculada no servidor (src/equipments/equipments.service.ts:36-40). O teste da API confere que outro usuário vê o equipamento como `emprestado`. |
| CA-03 | test/loans.e2e-spec.ts:124; test/loans-api.e2e-spec.ts:165 | ATENDIDO | O trigger recusa com 'Equipamento em manutenção' (migration :41-42). A API devolve 409 (src/loans/loans.service.ts:49-50). |
| CA-04 | test/loans.e2e-spec.ts:131; test/loans-api.e2e-spec.ts:172 | ATENDIDO | O trigger recusa com 'Equipamento já emprestado' (migration :44-46). |
| CA-05 | test/loans.e2e-spec.ts:140; test/loans-api.e2e-spec.ts:180 | ATENDIDO | O limite está em `>= 5` (migration :63). Entre 273313f e o HEAD, a pasta supabase/ e a pasta src/ não mudaram. |
| CA-06 | test/loans.e2e-spec.ts:148, :161; test/loans-api.e2e-spec.ts:189 | ATENDIDO | Recusa quando `due_at < now()` e não há devolução (migration :54-58). A checagem vem depois das checagens do equipamento, como pede a decisão de 2026-11-16. |
| CA-07 | test/loans.e2e-spec.ts:168 | ATENDIDO | O banco garante 1 só empréstimo com o índice único `loans_one_open_per_equipment` e com o `for update` (migration :37). A tradução de 23505 para 409 na API (src/loans/loans.service.ts:31) não tem teste via HTTP. |
| CA-08 | test/loans.e2e-spec.ts:180, :188, :196; test/loans-api.e2e-spec.ts:93, :99 | ATENDIDO | O guard valida o token em `/auth/v1/user` (src/auth/supabase-auth.guard.ts:27-35). O papel `anon` não pode executar `request_loan` (initial_schema.sql:301). |
| CA-09 | test/loans.e2e-spec.ts:210, :220, :230; test/loans-api.e2e-spec.ts:202 | ATENDIDO | Os testes de RLS rodam sem banco mocado. A policy `loans_read_borrower_or_operations` não foi alterada. `GET /loans/me` roda com `asUser` e também filtra por `borrower_id` (loans.service.ts:56-60). |
| CA-10 | test/loans-api.e2e-spec.ts:107, :121, :140, :159, :165, :172, :180, :189, :202, :215 | SEM TESTE | Há teste para 400, 401, 201, 200, para o formato de `imagem` e para "devolvido não aparece em /loans/me" (:215, a lacuna da rodada 04 foi resolvida). Falta teste para um 409 do contrato: a recusa 'Equipamento não encontrado' (regra 7, decisão de 2026-11-16). Ela está no código (migration :38-40, loans.service.ts:10), mas nenhum teste a exercita. A mensagem do commit 9cd74fc cita "409 não encontrado (CA-10)", porém o commit só mexeu na spec.md e no teste de devolvido. A exceção de `GET /equipments` sem `asUser` agora está escrita no contrato. |
| CA-11 | — | OUTRO REPOSITÓRIO | A prova fica no repo TI-CORP-frontend (spec 001 de lá, commit e4ed174 do front) e precisa ser verificada lá. |

Checks: `npm test` → passou (executado pelo humano no HEAD 9cd74fc, depois de `npm run db:reset`, e entregue como evidência: "Test Suites: 10 passed, 10 total / Tests: 60 passed, 60 total"; não executado aqui)
Checks: `npm run build` → passou (executado pelo humano e entregue como evidência: sem erro; não executado aqui)
Checks: `git status --short` → passou (evidência do humano: vazio; `git rev-parse HEAD` = 9cd74fca2f61bdb55bfb56a55e50d7caaec0dce1, conferido aqui em modo leitura)
Fora de escopo: nada encontrado. Não há endpoint de devolução, renovação, reserva, aprovação ou e-mail: os controllers são só health, loans e equipments. O `return_loan` já existe no schema inicial e não está exposto na API.
Veredito: NÃO PRONTA — a recusa 409 'Equipamento não encontrado', que entrou no contrato pela regra 7 e é coberta pelo CA-10, não tem teste que a exercite.
