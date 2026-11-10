# ADR-001 — Stack

**Status:** aceito (fechado em 2026-11-10 a pedido do time; justificativas e alternativas redigidas pelo agente a partir do que já existia no repositório, revisar)
**Negócio:** docs/PRD.md

## Contexto
Sistema web interno de empréstimo de equipamentos. Dois repositórios: este
(back, banco e contrato da API) e TI-CORP-frontend (interface). Dois projetos
na Vercel, um por repositório, e um projeto Supabase como banco.

## Decisão
| Item | Escolha |
|---|---|
| Repositórios | dois: back (`TI-CORP`) e front (`TI-CORP-frontend`) |
| Hospedagem | Vercel (um projeto por repositório) |
| Frontend | TypeScript + React, SPA com Vite (ver ADR-002 do repo front) |
| Backend | TypeScript + NestJS |
| Estilo da API | REST, organizado em MVC |
| Banco | PostgreSQL no Supabase |
| Autenticação | Supabase Auth (identidade e sessão por JWT) |
| Autorização | RLS no Postgres, mais checagens nas funções SQL de empréstimo |
| Acesso ao banco | Prisma Client, só para consulta e escrita de dados |
| Migrations | SQL versionado em `supabase/migrations/`, criado pela Supabase CLI |
| Validação | Zod |
| Testes | Jest |
| Execução local | banco local pela Supabase CLI (`supabase db reset`) |

## Justificativas
- **Dois repositórios:** decisão do time; o front e o back publicam em projetos Vercel distintos e evoluem em ritmos diferentes.
- **Vercel:** os dois deploys já existem lá, com deploy automático por push.
- **TypeScript:** um só idioma nos dois lados reduz divergência de contrato.
- **NestJS + MVC:** estrutura padrão do framework, sem organização própria a inventar.
- **REST:** o front consome recursos simples (equipamentos, empréstimos); não há consulta flexível que justifique outro estilo.
- **Supabase (Postgres, Auth, RLS):** um provedor entrega banco, identidade e políticas de acesso, sem integrar serviços separados.
- **Autorização por RLS:** o schema inicial já habilita RLS nas três tabelas, com políticas por papel.
- **Prisma só para dados:** o schema já tem triggers, funções e políticas que o Prisma Migrate não representa; ele entra para tipar o acesso, não para mudar o schema.
- **Migrations em SQL:** é o único formato que carrega triggers, funções e RLS, e a rule migration.md já o exige.
- **Zod:** valida a entrada nas bordas da API em TypeScript.
- **Jest:** é o runner que o NestJS traz por padrão.
- **Banco local:** teste e desenvolvimento nunca tocam o projeto remoto.

## Alternativas descartadas
- Monolito com um só repositório — descartado porque o time decidiu por dois repositórios e dois deploys.
- Next.js full-stack — descartado porque o front já existe em Vite e o back precisa de um contrato de API próprio.
- Prisma Migrate para o schema — descartado porque não expressa RLS, triggers nem funções, que são centrais às regras de empréstimo. Se isso mudar, este ADR deve ser revisto.
- Autenticação própria (senha e sessão no NestJS) — descartada porque duplicaria o que o Supabase Auth já faz.
- Autorização só na API NestJS — descartada porque quem usa a chave pública acessaria o banco sem passar por ela; a RLS protege nos dois caminhos.
- Vitest no back — descartado para manter o runner padrão do NestJS.

## Consequências
**Fica mais fácil:**
- Provisionar auth, banco e RLS num único provedor.
- Garantir regras de empréstimo (limite, disponibilidade, concorrência) dentro do banco, onde valem para qualquer cliente.
- Tipagem ponta a ponta em TypeScript.

**Fica mais difícil:**
- Trocar de provedor exige migrar Auth, RLS e funções juntos.
- Duas fontes do modelo de dados: o SQL (verdade) e o Prisma schema (derivado por `prisma db pull`); é preciso sincronizá-los a cada migration.
- Mudança de contrato da API exige coordenar dois repositórios.
- Lógica de negócio no banco pede teste contra um Postgres real, não mock.

**O que isso impede de fazer depois sem custo:**
- Sair do Supabase mantendo o mesmo modelo de identidade e autorização.
- Trocar o ORM sem refazer o mapeamento de schema.
- Unificar os repositórios sem reorganizar pipelines e variáveis de ambiente.

## O que este ADR NÃO decide
- Como o NestJS roda na Vercel (função serverless ou outro formato).
- Biblioteca de testes do front.
- Estrutura interna de pastas e módulos do NestJS (vira ADR-003 se for cara de mudar).
- Formato de erro da API.
- CI/CD além do deploy automático da Vercel, observabilidade e cache.
- Política de versionamento da API.
