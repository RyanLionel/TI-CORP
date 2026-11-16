# Plano — Solicitar empréstimo
Restrições: ADR-001 (RLS, regras em funções SQL, migrations em SQL, Prisma só para dados), rules/migration.md, rules/secrets.md.
1. Regras no banco (única fonte da verdade, também sob concorrência): trigger `enforce_loan_rules` e `request_loan`; `add_business_days` para o prazo.
2. API NestJS fina: guard que valida o token no Supabase Auth; serviço que executa `request_loan` como o usuário (papel `authenticated` + claims na transação), traduz a mensagem do banco em 409.
3. Catálogo lê situação calculada no servidor (emprestado = tem empréstimo em aberto), porque o RLS não deixa o colaborador ver empréstimo alheio.
4. Testes contra banco local (rules/tests.md); verificador-spec antes de declarar pronta.
