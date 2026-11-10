# Andar zero — prova do ADR-001
Isto não é uma spec: não há comportamento de produto. É a verificação de que a stack do ADR-001 funciona junta numa máquina limpa.

## Critérios de aceitação
- AZ-01 · um comando único sobe o banco local e a API
- AZ-02 · a API conecta no banco; sem banco, erro claro e imediato
- AZ-03 · a migration inicial aplica do zero com `supabase db reset`
- AZ-04 · GET /health devolve 200 e o status da conexão com o banco
- AZ-05 · uma página do front (repo TI-CORP-frontend) mostra o resultado de AZ-04
- AZ-06 · um comando roda os testes; há ao menos um teste sobre AZ-04
- AZ-07 · configuração via variável de ambiente, com .env.example versionado
- AZ-08 · .env no .gitignore e nenhum segredo no repositório

## Estado (verificado em 2026-11-10, máquina local)
- AZ-01 · `npm run up` sobe o banco local, builda e inicia a API
- AZ-02 · sem banco ou sem DATABASE_URL a API falha na subida com mensagem clara (testes AZ-02 em src/config/env.spec.ts)
- AZ-03 · `supabase db reset` aplica a migration inicial; 3 tabelas com RLS
- AZ-04 · test/health.e2e-spec.ts (200 com banco; 503 sem banco)
- AZ-05 · página do repo TI-CORP-frontend consome /health (ver spec lá)
- AZ-06 · `npm test`: 4 testes passando
- AZ-07 · .env.example versionado; configuração validada com Zod
- AZ-08 · .env no .gitignore; `git ls-files | grep env` só mostra .env.example

## Fora de escopo
Qualquer funcionalidade do PRD.

## Não decidido ainda
Organização de pastas do NestJS (possível ADR-003); como o NestJS roda na Vercel.
