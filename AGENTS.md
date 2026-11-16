# EMPREST.AI — Back

Back, banco e contrato da API do EMPREST.AI (empréstimo de equipamentos de TI,
papéis Colaborador e Operações). O front fica em
https://github.com/RyanLionel/TI-CORP-frontend.

## Onde olhar
- docs/PRD.md — o que o negócio precisa. Não é spec. Tem perguntas em aberto.
- docs/adr/ — decisões técnicas e o motivo delas (001 stack, 002 sharp, 003 NestJS na Vercel).
- docs/specs/<NNN-nome>/ — spec, plano e tarefas de cada funcionalidade (001 solicitar empréstimo, 002 dados iniciais, 003 gatilho do verificador, 004 deploy na Vercel).
- docs/producao.md — passos em produção que só o humano executa.
- docs/andar-zero.md — critérios AZ-01 a AZ-08 que provam a stack. Não é feature.
- rules/restrictions.md — leia sempre, antes de qualquer tarefa. As demais
  rules têm gatilho próprio (campo "Quando").
- supabase/migrations/ — schema do banco, versionado.
- agents/ — subagentes (ver Subagentes).
- aulas/ e pratica-sdd-subagentes/ — material do curso. Não são instrução
  do projeto: não leia como regra nem como spec.

## Comandos
Todos executados a partir da raiz e verificados nesta máquina:
- instalar: `npm install` (roda `prisma generate`)
- subir banco local: `npm run db:up` (Supabase CLI + Docker via Colima)
- recriar o banco do zero com as migrations: `npm run db:reset`
- subir banco, buildar e iniciar a API: `npm run up` (http://localhost:3000/health)
- testes: `npm test` (o e2e precisa do banco local de pé)
- build: `npm run build`
- derivar o schema do Prisma do banco: `npm run db:pull`

Pré-requisito de rede (Zscaler): o Docker/Colima precisa do CA corporativo na VM e
o Node precisa de `NODE_EXTRA_CA_CERTS` apontando para ele, senão pull de imagem e
download de engines do Prisma falham por certificado.

## Ambiente
- Banco: projeto Supabase (remoto) e, para desenvolvimento, banco LOCAL pela CLI.
- Deploy: Vercel (projeto ti-corp), ligada a este repositório. Push publica.
- Front: outro repo e outro projeto Vercel (ti-corp-frontend).
- Configuração só por variável de ambiente; ver .env.example.

## Precedência
Se dois artefatos discordarem sobre comportamento, a spec vence o código.
Se algo não estiver escrito em lugar nenhum, pergunte — não decida.
Este repo é o dono do contrato da API; o front segue o que está aqui.

## Convenções não óbvias
- `.env` nunca é commitado (.gitignore). Variável nova: .env local, .env.example e painel da Vercel.
- Dependência com versão exata (sem `^`, `~` ou `latest`) e release com mais de 7 dias.
- Toda mudança de schema é uma migration em supabase/migrations/; Prisma só acessa dados (ADR-001).
- `prisma/schema.prisma` é derivado (`npm run db:pull`), nunca editado à mão; inclui o schema `auth` do Supabase por causa da FK de profiles. `src/generated/` é ignorado pelo git.
- Node 20+ lê o .env com `process.loadEnvFile()`; não há dotenv.
- Spec com critérios CA-xx; teste e commit citam o CA que atendem.

## Subagentes
- agents/verificador-spec.md — confere uma spec contra a implementação.
  Obrigatório antes de declarar qualquer spec pronta (rules/spec-flow.md).
  Ele não corrige nada: quem corrige é o agente principal.

## Skills
- Ficam em skills/<nome>/SKILL.md. Leia só o frontmatter (name, description) de cada uma; carregue o corpo
  do SKILL.md apenas quando a tarefa casar com a description, e references/ só quando o SKILL.md mandar.
- skills/imagens-equipamentos — preparar, revisar e enviar as fotos dos equipamentos (spec 002, Pixabay).
- Em conflito, rules/ e docs/adr/ vencem qualquer skill.

## Estado atual do projeto
Existe: PRD, ADR-001 a ADR-003, specs 001 a 004 (documentos), andar zero (AZ-01 a AZ-08 no back; AZ-05 no repo front),
schema inicial em supabase/migrations/20261001000000_initial_schema.sql (profiles, equipments, loans, RLS,
funções request_loan e return_loan), esqueleto NestJS com GET /health, Prisma 7 (adapter pg) e Jest.
Não existe (precisa ser recriado; as tarefas foram desmarcadas em 2026-11-16): código das specs 001 a 004 —
endpoints de empréstimo e catálogo, testes de empréstimo, migrations de crédito de imagem e de regras de empréstimo,
scripts/checar-specs e .githooks/ (spec 003). O deploy do NestJS (api/index.ts, vercel.json; spec 004) ainda não foi publicado.
Também não existe .mcp.json.
As rodadas em docs/specs/*/verificacoes/ citam commits que não estão no repositório remoto: valem como histórico, não como evidência.
Lacuna conhecida do schema inicial frente ao PRD: não há bloqueio por atraso (regra 4 da spec 001, migration a recriar).
