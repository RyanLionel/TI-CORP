# Tarefas — Solicitar empréstimo
> 2026-11-16: o código de T2 a T5 e T8 não está em nenhum repositório (local ou GitHub). Tarefas desmarcadas para recriar.
> As rodadas 01 e 02 em verificacoes/ citam os commits 71e47fe e e2fa0ee, que não existem no remoto: serão refeitas.
- [x] T1 · Prazo e limite decididos (14 dias úteis, 5), PRD atualizado (todos os CA)
- [ ] T2 · Migration 20261116134500_regras_solicitar_emprestimo (CA-01, CA-03 a CA-06) — DDL aprovado por Ryan em 2026-11-16; aplicada do zero sobre a inicial em PostgreSQL 16 com stubs de auth (2026-11-16); falta `npm run db:reset` no Supabase local
- [ ] T3 · Testes de regra no banco: test/loans.e2e-spec.ts (CA-01 a CA-07) — cenários CA-01 a CA-07 conferidos via psql (todos passaram); falta rodar `npm test` (Jest)
- [ ] T4 · Testes de RLS e autenticação: CA-08, CA-09 (mesmo arquivo)
- [ ] T5 · Endpoints REST: src/loans, src/auth; test/loans-api.e2e-spec.ts (CA-10)
- [ ] T6 · Verificador-spec: rodadas em docs/specs/001-solicitar-emprestimo/verificacoes/ (inclui a prova com erro plantado)
- [ ] T7 · Deploy do NestJS na Vercel (ADR-003, spec 004; publicar é do humano) e conferência em produção
- [ ] T8 · Front: catálogo, solicitar, meus empréstimos (CA-11, repo TI-CORP-frontend). Biblioteca de testes do front ainda não decidida (front/rules/tests.md): propor e esperar.
