# ADR-003 — NestJS como função serverless na Vercel

**Status:** aceito (direção aprovada pelo Ryan em 2026-11-11; texto redigido pelo agente, revisar). Não foi publicado nem testado na Vercel: só localmente.
**Negócio:** docs/specs/004-deploy-vercel · fecha o "não decidido" do ADR-001

## Contexto
O ADR-001 fixa Vercel para os dois repos, mas não dizia como o NestJS roda lá. A Vercel não mantém processo com `listen()`: ela executa funções.

## Decisão
- `api/index.ts` é a função da Vercel: sobe o Nest uma vez por instância (`app.init()`, sem `listen`) e entrega cada requisição ao Express do Nest.
- `vercel.json` reescreve todas as rotas (`/(.*)`) para `/api`, então os caminhos da API não mudam (`/health`, `/equipments`, `/loans`).
- Prisma via pooler de transação (`DATABASE_URL` com `pgbouncer=true`, `.env.example`); `postinstall` roda `prisma generate`, e ele não exige variável de ambiente.
- `src/main.ts` continua sendo o servidor local (`npm run up`).

## Alternativas consideradas
- **Outro host para a API (Railway, Render, Fly):** processo persistente, mais natural ao Nest, mas contraria o ADR-001 (Vercel nos dois) e abre um segundo lugar para segredos e deploy.
- **Reescrever as rotas como funções soltas da Vercel:** descarta o NestJS do ADR-001.
- **Supabase Edge Functions:** muda a stack inteira.

## Consequências
- Cold start a cada instância nova; o app fica em cache entre chamadas quentes.
- Conexões ao Postgres só pelo pooler de transação; conexão direta esgotaria o limite.
- Variáveis na Vercel do back: `DATABASE_URL`, `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `FRONT_ORIGIN` (nunca a service_role: ela só serve aos scripts do humano).
- Só a execução local do handler foi provada (test/vercel-handler.e2e-spec.ts). Que funciona na Vercel só se sabe depois do deploy; o humano confere `GET /health` no link.

**Nota (2026-11-17):** o primeiro deploy de produção falhou com "No Output Directory named public": o projeto na Vercel está como framework "Other" e exige uma pasta de saída estática. Solução: `public/robots.txt` (bloqueia indexação). Os arquivos estáticos não contêm código nem segredo; toda rota que não é arquivo segue o rewrite para `/api`.
