# Plano — Solicitar empréstimo
1. Responder as perguntas do PRD (prazo, limite) e atualizar a spec.
2. Migration nova: bloqueio por atraso em `enforce_loan_rules` (mostrar o DDL e esperar aprovação, rules/migration.md).
3. Testes SQL/Jest contra banco local para CA-01 a CA-09 (rules/tests.md). Depende do andar zero.
4. Endpoint REST NestJS que chama `request_loan` com o JWT do usuário (não usa service_role).
5. Verificador-spec antes de declarar pronta.
