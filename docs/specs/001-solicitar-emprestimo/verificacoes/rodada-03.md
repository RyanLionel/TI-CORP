> Rodada 3 · PROVA COM ERRO PLANTADO (commit 5f6bfb8: limite 6 em vez de 5 na migration 20261116134500). Resposta literal do subagente verificador-spec, aberto como agente novo, sem o contexto da sessão principal (plano B da aula 11: "Aja conforme agents/verificador-spec.md").
> Adaptação de harness (2026-11-16): o subagente não executa `npm test`/`npm run build` neste ambiente (Docker e binários do Windows só na máquina do Ryan). Os checks foram executados pelo Ryan no HEAD e entregues ao subagente como evidência. Ele leu o código e os testes só em modo leitura.
> As rodadas 01 e 02 citam commits que não existem no remoto (ver tasks.md): valem só como histórico.

Spec: docs/specs/001-solicitar-emprestimo/spec.md · Rodada: 3 · Commit: 5f6bfb8ea4475f2116ba05bda025ec5e202d7992 · Árvore: limpa

| CA | evidência (arquivo:linha do teste) | status | observação |
|---|---|---|---|
| CA-01 | test/loans.e2e-spec.ts:83, :90, :99; test/loans-api.e2e-spec.ts:140 | ATENDIDO | `request_loan` grava `auth.uid()` e `add_business_days(now(), 14)` (migration 20261116134500:85-87). Esses testes não estão entre as 3 falhas. |
| CA-02 | test/loans.e2e-spec.ts:113; test/loans-api.e2e-spec.ts:152 | ATENDIDO | Situação calculada no servidor em src/equipments/equipments.service.ts:35-40. |
| CA-03 | test/loans.e2e-spec.ts:124; test/loans-api.e2e-spec.ts:165 | ATENDIDO | Trigger `enforce_loan_rules`: 'Equipamento em manutenção'. O 409 vem de src/loans/loans.service.ts. |
| CA-04 | test/loans.e2e-spec.ts:131; test/loans-api.e2e-spec.ts:172 | ATENDIDO | Trigger: 'Equipamento já emprestado'. |
| CA-05 | test/loans.e2e-spec.ts:140 (asserção em :144); test/loans-api.e2e-spec.ts:180 (asserção em :185) | REPROVADO | A migration 20261116134500_regras_solicitar_emprestimo.sql:63 tem `if open_loans_count >= 6`. Com 5 em aberto, a 6ª solicitação é aceita (API: esperado 409, recebido 201). A mensagem diz "Limite de 5", mas a regra deixa chegar a 6. A diferença foi introduzida pelo commit 5f6bfb8 ("ERRO PLANTADO - limite 6 em vez de 5"). A falha de loans.e2e-spec.ts:140 eu deduzi pela leitura do código e do teste, porque a saída de teste chegou cortada. |
| CA-06 | test/loans.e2e-spec.ts:148, :161; test/loans-api.e2e-spec.ts:189 | ATENDIDO | Trigger: 'Você tem empréstimo em atraso' (`due_at < now()` sem devolução). |
| CA-07 | test/loans.e2e-spec.ts:168 | ATENDIDO | Índice único `loans_one_open_per_equipment` mais o `for update` no equipamento. A tradução de 23505 para 409 na API (loans.service.ts:33) não tem teste via HTTP. |
| CA-08 | test/loans.e2e-spec.ts:180, :188, :196; test/loans-api.e2e-spec.ts:93, :99 | ATENDIDO | O guard src/auth/supabase-auth.guard.ts valida o token em `/auth/v1/user`. |
| CA-09 | test/loans.e2e-spec.ts:210, :220, :230; test/loans-api.e2e-spec.ts:202 | ATENDIDO | Os testes de RLS (colaborador não lê o de outro; Operações lê todos) não estão entre as falhas. O teste loans-api.e2e-spec.ts:202, que também cita CA-09, falhou em :211 (6 itens em vez de 5), mas isso é efeito do defeito do CA-05: o usuário `c` conseguiu 6 empréstimos. A falha não vem da RLS. |
| CA-10 | test/loans-api.e2e-spec.ts:107, :121, :140, :159, :165, :172, :180, :189, :202 | REPROVADO | Dois testes que citam CA-10 falharam: :180 (esperava 409 e recebeu 201) e :202 (`GET /loans/me` esperava 5 e recebeu 6). O contrato de 409 na 6ª solicitação não é cumprido. |
| CA-11 | — | OUTRO REPOSITÓRIO | A prova fica no repo TI-CORP-frontend (spec 001 de lá, commit e4ed174 do front). Precisa ser verificada lá. |

Checks: `npm test` → falhou (executado pelo humano no HEAD 5f6bfb8 e entregue como evidência: "Tests: 3 failed, 56 passed, 59 total"; Suites: 2 failed, 8 passed)
Checks: `npm run build` → passou (executado pelo humano e entregue como evidência, sem mensagens)
Checks: `git status --short` → passou (executado pelo humano e entregue como evidência: vazio; `git rev-parse HEAD` = 5f6bfb8ea4475f2116ba05bda025ec5e202d7992)
Fora de escopo: nada encontrado. Não há endpoint de devolução, renovação, reserva, aprovação ou e-mail; os controllers são só health, loans e equipments. Uma observação menor: o trigger e o `RULE_MESSAGES` têm uma recusa 'Equipamento não encontrado', que não está entre os três motivos da regra 7.
Veredito: NÃO PRONTA — a migration aceita até 6 empréstimos em aberto (`>= 6` em vez de `>= 5`), o que quebra o CA-05 e o CA-10 com 3 testes vermelhos.
