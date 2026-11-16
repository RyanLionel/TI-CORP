# Passos em produção (só o humano executa)
O agente não escreve no Supabase nem na Vercel. Com o `.env` de produção preenchido por você (nunca commitado):

1. Aplicar as migrations no projeto Supabase de produção (SQL Editor ou `supabase db push` após `supabase link`), na ordem:
   `20261001000000_initial_schema`, `20261116193000_equipamento_imagem_credito`, `20261116134500_regras_solicitar_emprestimo`.
2. Criar equipamentos e a conta do professor: `SEED_CONFIRM_REMOTE=sim npm run seed:dados-iniciais`
   (precisa de `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `DIRECT_URL` e `SEED_PROFESSOR_PASSWORD` no `.env`).
3. Imagens (skill imagens-equipamentos): `PIXABAY_API_KEY` no `.env`; `npm run imagens:preparar`; abra `tmp/imagens/`, marque
   `aprovada` (true/false + motivo) em `scripts/dados-iniciais/revisao-imagens.json` (ver skills/imagens-equipamentos/references/revisao-visual.md);
   depois `SEED_CONFIRM_REMOTE=sim npm run imagens:enviar`.
4. Vercel do back (ADR-003): variáveis `DATABASE_URL` (pooler 6543), `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `FRONT_ORIGIN` (preview e production). Nunca a service_role.
   Depois do deploy, confira `GET <link-do-back>/health` (CA-03 da spec 004).
5. Vercel do front: `VITE_API_URL`, `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`.
6. Conferir com uma conta SUA (não a do professor): catálogo, solicitar, limite, manutenção. Depois confirme que o professor segue com zero empréstimos.
