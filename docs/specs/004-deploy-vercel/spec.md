# Spec — Deploy do NestJS na Vercel

> Status: rascunho. ADR-003 existe; api/index.ts e vercel.json precisam ser recriados (2026-11-16).

## Objetivo
A API responde no link da Vercel com as mesmas rotas do ambiente local.

## Vínculo
ADR-003 (este repo) · ADR-001 · rules/secrets.md · docs/producao.md

## Regras
1. `api/index.ts` é a única função; `vercel.json` reescreve tudo para ela.
2. Nenhuma variável com valor no repositório; as quatro do ADR-003 vão ao painel da Vercel à mão.
3. O agente não publica: o deploy é do humano.

## Critérios de aceitação
- CA-01 · O handler devolve 200 em `GET /health` com status e banco.
- CA-02 · Uma rota protegida devolve 401 sem token, pelo handler.
- CA-03 · No link de produção, `GET /health` devolve 200 `{status:"ok",database:"up"}` (conferência humana).

## Fora de escopo
CI de deploy, domínio próprio, múltiplas regiões.

## Contrato afetado
Nenhum endpoint muda. Novos: `api/index.ts`, `vercel.json`.
