---
description: Como se escreve e se roda teste neste projeto
globs: ["**/*.spec.ts", "**/*.e2e-spec.ts", "**/*.test.ts", "**/*.test.tsx"]
alwaysApply: false
---

# Testes
> leitor: agente

## Quando
Ao escrever, alterar ou remover qualquer teste.

## Procedimento
1. Testes rodam contra o banco local. Nunca contra o remoto.
2. O nome do teste cita o critério que ele prova: `CA-03: ...`.
3. Teste de endpoint verifica status E corpo.
4. Unitário em `*.spec.ts`; integração em `*.e2e-spec.ts` (ADR-001: Jest).
5. Tabela com política de acesso (RLS) tem um teste que prova o bloqueio:
   o mesmo dado, consultado com outro usuário, não retorna. Esse teste
   não usa banco mocado: a coisa sob teste é a política.

## Verificação
O comando de testes passa com o banco local recém-resetado.

## Não faça
- Não teste código gerado pelo Prisma, o framework ou bibliotecas externas.
- Não escreva teste sem citar um CA da spec.
- Não aponte teste para o banco de produção.
