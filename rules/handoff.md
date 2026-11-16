---
description: O que registrar ao fechar uma sessão
globs: []
alwaysApply: false
---

# Fim de sessão
> leitor: agente

## Quando
Ao terminar uma tarefa do plano, ou quando a pessoa disser "vamos fechar".

## Procedimento
Sobrescreva `handoff.md` na raiz com, no máximo, 25 linhas:
1. Onde parei — tarefa e critério em andamento.
2. O que está commitado e em qual branch.
3. O que está aplicado no banco local mas ainda não commitado.
4. O que já foi publicado.
5. O que não fazer na próxima sessão e por quê.
6. O próximo passo, em uma frase imperativa.

## Verificação
Uma sessão nova, lendo só `handoff.md` e a spec, continua sem perguntar o que já foi feito.

## Não faça
- Não cole segredo, token ou conteúdo de `.env`.
- Não descreva intenção que não esteja no git ou no banco local.
