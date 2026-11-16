# Tarefas — Solicitar empréstimo
> 2026-11-16: o código de T2 a T5 e T8 não está em nenhum repositório (local ou GitHub). Tarefas desmarcadas para recriar.
> As rodadas 01 e 02 em verificacoes/ citam os commits 71e47fe e e2fa0ee, que não existem no remoto: serão refeitas.
- [x] T1 · Prazo e limite decididos (14 dias úteis, 5), PRD atualizado (todos os CA)
- [x] T2 · Migration 20261116134500_regras_solicitar_emprestimo (CA-01, CA-03 a CA-06) — DDL aprovado por Ryan em 2026-11-16; `npm run db:reset` aplicou do zero (2026-11-16)
- [x] T3 · Testes de regra no banco: test/loans.e2e-spec.ts (CA-01 a CA-07) — `npm test`: 3 suítes, 14 testes passando (2026-11-16)
- [x] T4 · Testes de RLS e autenticação: CA-08, CA-09 (test/loans.e2e-spec.ts) — `npm test`: 3 suítes, 20 testes passando (2026-11-16)
- [x] T5 · Endpoints REST: src/loans, src/equipments, src/auth; test/loans-api.e2e-spec.ts (CA-10) — `npm test`: 4 suítes, 34 testes passando (2026-11-16)
- [ ] T6 · Verificador-spec: rodadas em docs/specs/001-solicitar-emprestimo/verificacoes/ (inclui a prova com erro plantado)
- [ ] T7 · Deploy do NestJS na Vercel (ADR-003, spec 004; publicar é do humano) e conferência em produção
- [x] T8 · Front: catálogo, solicitar, meus empréstimos (CA-11, repo TI-CORP-frontend, spec 001 de lá: CA-02 e CA-05; Vitest, ADR-004) — 17 testes passando (2026-11-16, commit e4ed174 do front)
