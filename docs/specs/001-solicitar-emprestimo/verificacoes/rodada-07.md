> Rodada 7 · resposta literal do subagente verificador-spec, aberto como agente novo, sem o contexto da sessão principal (plano B da aula 11).
> Adaptação de harness (2026-11-17): os checks foram executados pelo Ryan no HEAD e entregues ao subagente como evidência; ele leu código e testes só em modo leitura.
> O subagente não escreveu a linha de cabeçalho; ela foi completada pela sessão principal com os dados que ele mesmo conferiu (HEAD fe3fde1…, árvore vazia).

Spec: docs/specs/001-solicitar-emprestimo/spec.md · Rodada: 7 · Commit: fe3fde1ffcf7eb04302806b4ca9412b1e798c01f · Árvore: limpa

| CA | evidência (arquivo:linha do teste) | status | observação |
|---|---|---|---|
| CA-01 | test/loans.e2e-spec.ts:83, :90, :99; test/loans-api.e2e-spec.ts:140 | ATENDIDO | Os dois arquivos de teste e a pasta supabase/ estão iguais aos do commit 6fa1438. `request` em src/loans/loans.service.ts não mudou: continua rodando `request_loan` com `asUser`. O prazo de 14 dias úteis vem de `add_business_days`, na migration 20261116134500. |
| CA-02 | test/loans.e2e-spec.ts:113; test/loans-api.e2e-spec.ts:152 | ATENDIDO | src/equipments não mudou desde a rodada 06. A `situacao` continua sendo calculada no servidor. |
| CA-03 | test/loans.e2e-spec.ts:124; test/loans-api.e2e-spec.ts:165 | ATENDIDO | `RULE_MESSAGES` e `ruleRefusal` continuam iguais (loans.service.ts:5-33). A recusa sai como 409 'Equipamento em manutenção'. |
| CA-04 | test/loans.e2e-spec.ts:131; test/loans-api.e2e-spec.ts:172 | ATENDIDO | A recusa sai como 409 'Equipamento já emprestado'. |
| CA-05 | test/loans.e2e-spec.ts:140; test/loans-api.e2e-spec.ts:186 | ATENDIDO | A migration não mudou, então o limite continua `>= 5`. |
| CA-06 | test/loans.e2e-spec.ts:148, :161; test/loans-api.e2e-spec.ts:195 | ATENDIDO | Recusa por atraso, checada depois das regras do equipamento. Nada mudou aqui. |
| CA-07 | test/loans.e2e-spec.ts:168 | ATENDIDO | O índice único e a tradução de 23505 (loans.service.ts:31) não mudaram. A tradução para 409 continua sem teste via HTTP, como na rodada 06. |
| CA-08 | test/loans.e2e-spec.ts:180, :188, :196; test/loans-api.e2e-spec.ts:93, :99 | ATENDIDO | O guard não mudou. A rota nova `POST /loans/:id/return` está no mesmo controller e por isso também passa pelo `SupabaseAuthGuard`. |
| CA-09 | test/loans.e2e-spec.ts:210, :220, :230; test/loans-api.e2e-spec.ts:208 | ATENDIDO | Nenhuma migration nova, então a policy `loans_read_borrower_or_operations` está intacta. `mine` continua com `asUser` e com o filtro por `borrower_id`. |
| CA-10 | test/loans-api.e2e-spec.ts:107, :121, :140, :159, :165, :172, :180, :186, :195, :208, :221 | ATENDIDO | `POST /loans`, `GET /loans/me` e `GET /equipments` continuam com 400, 401 e 409, como no contrato. As respostas 403 e 404 só aparecem na rota nova de devolução, que segue o contrato da spec 005, não o desta. |
| CA-11 | — | OUTRO REPOSITÓRIO | A prova fica no repo TI-CORP-frontend, spec 001 de lá. A nota do humano diz que foi conferida na rodada-02, commit c5c59c3. |

Checks: `git rev-parse HEAD` → passou (fe3fde1ffcf7eb04302806b4ca9412b1e798c01f, conferido aqui)
Checks: `npm run db:reset; npm test` → passou (rodado pelo humano neste HEAD e entregue como evidência: "Test Suites: 12 passed, 12 total / Tests: 71 passed, 71 total"; não rodei aqui. O total bate com o diff: 64 testes da rodada 06, mais a suíte nova test/devolver.e2e-spec.ts com 7 testes.)
Checks: `npm run build` → passou (rodado pelo humano e entregue como evidência: sem erro; não rodei aqui)
Checks: `git -c core.autocrlf=true status --short` → passou (vazio, conferido aqui)
Fora de escopo: nada encontrado. A devolução entrou com `POST /loans/:id/return`, `giveBack`, `RETURN_REFUSALS` e test/devolver.e2e-spec.ts. Ela está fora do escopo da spec 001, mas pertence à spec 005, que já existe em docs/specs/005-devolver-emprestimo e usa a função `return_loan` do schema inicial, sem migration nova. Os nomes dos testes começam por CA-01 a CA-07, que são IDs da spec 005 e não contam como prova da 001. public/robots.txt é da spec 004 (ADR-003, nota de 2026-11-17) e não tem código. Fora do escopo desta rodada: o AGENTS.md ficou desatualizado, porque ainda diz "Não existe: … devolução" e fala em 64 testes.
Veredito: PRONTA — no commit fe3fde1, os CAs do back (CA-01 a CA-10) seguem com teste que os cita e com código que não mudou, a devolução pertence à spec 005, e o CA-11 continua para conferir no repo do front.
