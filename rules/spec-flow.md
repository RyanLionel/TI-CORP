---
description: Ciclo spec, plano e tarefas ao abrir uma funcionalidade nova
globs: ["docs/specs/**"]
alwaysApply: false
---

# Abrir funcionalidade nova
> leitor: agente

## Quando
Ao iniciar qualquer funcionalidade nova do PRD.

## Procedimento
1. Crie docs/specs/<NNN-nome-curto>/ com spec.md.
2. Antes de escrever a spec, liste as perguntas que o PRD não
   responde. Espere as respostas.
3. plan.md sai da spec e cita os ADRs que o restringem.
4. tasks.md sai do plano. Cada tarefa cita um CA-xx e cabe
   num commit.
5. Uma tarefa por vez. Ao terminar, siga rules/checks.md.
6. Ao terminar todas as tarefas, acione o subagente verificador-spec
   (agents/verificador-spec.md) antes de declarar a spec pronta.

## Verificação
Toda spec tem Objetivo, Vínculo, Regras, Critérios de aceitação com
CA-xx, Fora de escopo e Contrato afetado. Toda tarefa cita um CA.

## Não faça
- Não escreva código antes do plano aprovado.
- Não crie pasta de spec fora do padrão NNN-nome-curto.
- Não declare a spec pronta sem passar pelo verificador.
