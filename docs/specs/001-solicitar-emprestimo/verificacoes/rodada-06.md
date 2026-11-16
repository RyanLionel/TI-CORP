> Rodada 6 · resposta literal do subagente verificador-spec, aberto como agente novo, sem o contexto da sessão principal (plano B da aula 11).
> Adaptação de harness (2026-11-16): os checks foram executados pelo Ryan no HEAD e entregues ao subagente como evidência; ele leu código e testes só em modo leitura.

Spec: docs/specs/001-solicitar-emprestimo/spec.md · Rodada: 6 · Commit: 6fa1438a40121d9ded366dd3aa2249ae44a88b3b · Árvore: limpa

| CA | evidência (arquivo:linha do teste) | status | observação |
|---|---|---|---|
| CA-01 | test/loans.e2e-spec.ts:83, :90, :99; test/loans-api.e2e-spec.ts:140 | ATENDIDO | `request_loan` grava com `auth.uid()` e `add_business_days(now(), 14)`, contando os dias no fuso America/Sao_Paulo (migration 20261116134500). Entre 9cd74fc e 6fa1438, nada em supabase/ mudou. Em src/ entrou só src/seguranca/segredos.spec.ts. |
| CA-02 | test/loans.e2e-spec.ts:113; test/loans-api.e2e-spec.ts:152 | ATENDIDO | A `situacao` é calculada no servidor. O teste da API confere que outro usuário vê o equipamento como `emprestado`. |
| CA-03 | test/loans.e2e-spec.ts:124; test/loans-api.e2e-spec.ts:165 | ATENDIDO | Recusa com 'Equipamento em manutenção', que a API devolve como 409 (src/loans/loans.service.ts:49-50). |
| CA-04 | test/loans.e2e-spec.ts:131; test/loans-api.e2e-spec.ts:172 | ATENDIDO | Recusa com 'Equipamento já emprestado'. |
| CA-05 | test/loans.e2e-spec.ts:140; test/loans-api.e2e-spec.ts:186 | ATENDIDO | O limite continua em `>= 5`, porque a migration não mudou. Desde a rodada 05, as linhas dos testes da API que vêm depois da :180 andaram 6 linhas para baixo. |
| CA-06 | test/loans.e2e-spec.ts:148, :161; test/loans-api.e2e-spec.ts:195 | ATENDIDO | Recusa por atraso. A checagem vem depois das checagens do equipamento, como pede a decisão de 2026-11-16. |
| CA-07 | test/loans.e2e-spec.ts:168 | ATENDIDO | O índice único `loans_one_open_per_equipment` e o `for update` garantem 1 só empréstimo. A tradução de 23505 para 409 (src/loans/loans.service.ts:31) continua sem teste via HTTP. |
| CA-08 | test/loans.e2e-spec.ts:180, :188, :196; test/loans-api.e2e-spec.ts:93, :99 | ATENDIDO | Sem token ou com token inválido, a API devolve 401 e o teste confere status e corpo. O papel `anon` não executa `request_loan` nem lê empréstimos. |
| CA-09 | test/loans.e2e-spec.ts:210, :220, :230; test/loans-api.e2e-spec.ts:208 | ATENDIDO | Os testes de RLS rodam sem banco mocado e a policy `loans_read_borrower_or_operations` não mudou. `GET /loans/me` roda com `asUser` e também filtra por `borrower_id` (loans.service.ts:56-61). |
| CA-10 | test/loans-api.e2e-spec.ts:107, :121, :140, :159, :165, :172, :180, :186, :195, :208, :221 | ATENDIDO | A lacuna da rodada 05 foi resolvida. O teste novo em :180 manda um `randomUUID()` desconhecido e confere status 409 e `message` 'Equipamento não encontrado' (regra 7). O código que ele exercita é a migration 20261116134500:39 e a lista RULE_MESSAGES em loans.service.ts:10. Os outros pontos do contrato também têm teste: 400 (:159), 401 (CA-08), 201, 200 com `imagem` e o empréstimo devolvido fora de `/loans/me` (:221). |
| CA-11 | — | OUTRO REPOSITÓRIO | A prova fica no repo TI-CORP-frontend (spec 001 de lá) e precisa ser verificada lá. |

Checks: `npm run db:reset; npm test` → passou (executado pelo humano no HEAD 6fa1438 e entregue como evidência: "Test Suites: 11 passed, 11 total / Tests: 64 passed, 64 total"; não executado aqui. O total bate com o diff: 60 testes da rodada 05, mais 1 teste CA-10, mais 3 testes em segredos.spec.ts, que é uma suíte nova.)
Checks: `npm run build` → passou (executado pelo humano e entregue como evidência: sem erro; não executado aqui)
Checks: `git status --short` → passou (vazio, conferido aqui em modo leitura; `git rev-parse HEAD` = 6fa1438a40121d9ded366dd3aa2249ae44a88b3b)
Fora de escopo: nada encontrado. Os controllers continuam sendo só health, equipments (GET) e loans (POST, GET me), sem devolução, renovação, reserva, aprovação ou e-mail. O arquivo novo src/seguranca/segredos.spec.ts pertence à spec 002 (CA-09 de lá), não à 001, e é só teste, sem funcionalidade.
Veredito: PRONTA — todos os CAs do back (CA-01 a CA-10) têm teste que os cita e a recusa 409 'Equipamento não encontrado' agora é testada; falta conferir o CA-11 no repo do front.

> Nota do humano: o CA-11 foi conferido no repo TI-CORP-frontend, spec 001, verificacoes/rodada-02.md (PRONTA, commit c5c59c3).
