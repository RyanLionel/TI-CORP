# Tarefas — Deploy na Vercel
> 2026-11-16: o ADR-003 existe, mas api/index.ts, vercel.json e o teste do handler não estão no repositório.
- [x] T1 · api/index.ts e vercel.json (CA-01, CA-02) — ADR-003; prisma.config.ts deixa o `prisma generate` sem exigir variável (o build da Vercel quebraria) — `npm test`: 9 suítes, 54 testes passando (2026-11-16, commit fc7a3f0)
- [x] T2 · test/vercel-handler.e2e-spec.ts (CA-01, CA-02), aproveitado do teste original — `npm test`: 9 suítes, 54 testes passando (2026-11-16, commit fc7a3f0)
- [ ] T3 · Variáveis no painel e deploy (humano) — CA-03
