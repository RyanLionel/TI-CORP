# Plano — Devolver empréstimo (spec 005)

1. `POST /loans/:id/return` em `src/loans/loans.controller.ts`: valida o id com Zod (400) e chama o serviço com o usuário do guard.
2. `LoansService.giveBack` roda `select ... from public.return_loan(id)` com `asUser` (regra 3) e traduz as recusas do banco: "não encontrado" vira 404, "já devolvido" vira 409 e "sem permissão" vira 403.
3. Sem migration: a função `return_loan` do schema inicial já grava `returned_at` e `returned_by` e confere o dono (regras 1 e 2).
4. Testes em `test/devolver.e2e-spec.ts`, contra o Supabase local, com usuários reais do Auth local (CA-01 a CA-07).
5. Produção: só deploy do back, sem mudança no banco.
