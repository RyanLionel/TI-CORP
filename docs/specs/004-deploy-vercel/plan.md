# Plano — Deploy do NestJS na Vercel

Restrições: ADR-003, ADR-001, `rules/secrets.md`, `rules/operacao.md` (o agente não publica).

1. `api/index.ts` sobe o Nest sem `listen` e entrega a requisição ao Express. `vercel.json` reescreve `/(.*)` para `/api`, então os caminhos locais (`/health` e rotas protegidas) não mudam (CA-01, CA-02).
2. `test/vercel-handler.e2e-spec.ts` prova o handler: `GET /health` devolve 200 com status e banco; uma rota protegida devolve 401 sem token.
3. As variáveis `DATABASE_URL`, `SUPABASE_URL`, `SUPABASE_ANON_KEY` e `FRONT_ORIGIN` entram só no painel da Vercel. O humano publica e confere, no link de produção, `GET /health` com `{status:"ok",database:"up"}` (CA-03). Nenhum valor de segredo entra no repositório.
