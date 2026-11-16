> Rodada com ERRO PLANTADO (commit 71e47fe: limite 6 em vez de 5). Resposta literal do subagente verificador, contexto limpo. Desfeito no commit seguinte (git revert).

Spec: docs/specs/001-solicitar-emprestimo/spec.md · Rodada: 1 · Commit: 71e47fe5240da290ee07c2f8b46863838ce042ce · Árvore: limpa
| CA | evidência (arquivo:linha do teste) | status | observação |
|---|---|---|---|
| CA-01 | test/loans.e2e-spec.ts:58, :67; test/loans-api.e2e-spec.ts:45, :120 | ATENDIDO | `add_business_days(now(),14)` em `request_loan`. Cobre `borrower_id`, `due_at`, 201 e o 400 do body inválido. |
| CA-02 | test/loans.e2e-spec.ts:72; test/loans-api.e2e-spec.ts:57 | ATENDIDO | O catálogo devolve `emprestado` depois da solicitação. |
| CA-03 | test/loans.e2e-spec.ts:80; test/loans-api.e2e-spec.ts:64 | ATENDIDO | Recusa com "Equipamento em manutenção", 409 na API, sem empréstimo criado. |
| CA-04 | test/loans.e2e-spec.ts:87 | ATENDIDO | Recusa no nível do banco. Não há teste de API para o 409 de equipamento já emprestado. |
| CA-05 | test/loans.e2e-spec.ts:95; test/loans-api.e2e-spec.ts:71 | REPROVADO | Os dois testes falham. A migration usa `open_loans_count >= 6`, então a 6ª solicitação é aceita (201). O limite é 5. |
| CA-06 | test/loans.e2e-spec.ts:101, :107 | ATENDIDO | Recusa com "Você tem empréstimo em atraso". Empréstimo dentro do prazo não bloqueia. |
| CA-07 | test/loans.e2e-spec.ts:113 | ATENDIDO | Dois pedidos simultâneos geram 1 empréstimo. |
| CA-08 | test/loans.e2e-spec.ts:122; test/loans-api.e2e-spec.ts:79, :104 | ATENDIDO | 401 sem token nas 3 rotas e com token inválido (guard real, chave inválida). |
| CA-09 | test/loans.e2e-spec.ts:127, :135; test/loans-api.e2e-spec.ts:113 | ATENDIDO | RLS sem mock. |
| CA-10 | test/loans-api.e2e-spec.ts:88, :96, :45, :104, :120 | ATENDIDO | `situacao`, `imagem`, `dueAt`, `atrasado`, 400 e 401 cobertos. O 409 depende do CA-05. |
| CA-11 | — | OUTRO REPOSITÓRIO | Prova em TI-CORP-frontend (T8 aberta). |

Checks: npm test → falhou (2 falharam, 34 passaram, ambos em CA-05)
Checks: npm run build → passou
Checks: git status --short → passou (árvore limpa)
Fora de escopo: nada encontrado
Veredito: NÃO PRONTA — CA-05 reprovado: a migration usa `>= 6` em vez de `>= 5` e a 6ª solicitação é aceita; T6, T7 e T8 seguem abertas.
