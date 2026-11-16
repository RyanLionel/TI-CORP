> Rodada 2, após desfazer o erro plantado (commit e2fa0ee). Resposta literal do subagente verificador.

Spec: docs/specs/001-solicitar-emprestimo/spec.md · Rodada: 2 · Commit: e2fa0ee17e140053dbce3f58d5cb4db4f8f31c10 · Árvore: limpa
| CA | evidência (arquivo:linha do teste) | status | observação |
|---|---|---|---|
| CA-01 | test/loans.e2e-spec.ts:58, :67; test/loans-api.e2e-spec.ts:45, :120 | ATENDIDO | `request_loan` usa `add_business_days(now(), 14)` e `borrower_id = auth.uid()`. Cobre 201 e 400. |
| CA-02 | test/loans.e2e-spec.ts:72; test/loans-api.e2e-spec.ts:57 | ATENDIDO | Catálogo devolve `emprestado` depois da solicitação. |
| CA-03 | test/loans.e2e-spec.ts:80; test/loans-api.e2e-spec.ts:64 | ATENDIDO | 409 "Equipamento em manutenção". |
| CA-04 | test/loans.e2e-spec.ts:87 | ATENDIDO | Recusa no banco. Sem teste de API para este 409. |
| CA-05 | test/loans.e2e-spec.ts:95; test/loans-api.e2e-spec.ts:71 | ATENDIDO | `>= 5` (corrigido desde a rodada 1); 409 na API. |
| CA-06 | test/loans.e2e-spec.ts:101, :107 | ATENDIDO | "Você tem empréstimo em atraso". Sem teste de API para este 409. |
| CA-07 | test/loans.e2e-spec.ts:113 | ATENDIDO | Dois pedidos simultâneos geram 1 empréstimo. |
| CA-08 | test/loans.e2e-spec.ts:122; test/loans-api.e2e-spec.ts:79, :104 | ATENDIDO | 401 sem token nas 3 rotas e com token inválido. |
| CA-09 | test/loans.e2e-spec.ts:127, :135; test/loans-api.e2e-spec.ts:113 | ATENDIDO | RLS sem mock. |
| CA-10 | test/loans-api.e2e-spec.ts:88, :96, :45, :104, :120, :64, :71 | ATENDIDO | `situacao`, `imagem`, `dueAt`, `atrasado`, 400, 401 e 409. |
| CA-11 | — | OUTRO REPOSITÓRIO | Prova em TI-CORP-frontend (T8 aberta). |

Checks: npm test → passou (6 suites, 36 testes)
Checks: npm run build → passou
Checks: git rev-parse HEAD / git status --short → passou (árvore limpa)
Fora de escopo: nada encontrado
Veredito: NÃO PRONTA — CA-01 a CA-10 atendidos, mas CA-11 depende do front (T8) e T7 (deploy e conferência em produção) segue aberta.
