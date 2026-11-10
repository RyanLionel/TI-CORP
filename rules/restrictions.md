---
description: O que o agente não pode fazer neste projeto
globs: []
alwaysApply: true
---

# O que não fazer
> leitor: agente

## Autoridade
- Não escreva ADR. Se encontrar uma decisão que precisa de um, descreva
  a decisão e as alternativas, e PARE. Quem decide é o time.
- Não contrarie o que está em docs/adr/. Se precisar contrariar, pare e diga.
- Não responda por conta própria o que o PRD ou a spec deixaram ambíguo.
  Liste as perguntas e espere.
- Não escolha biblioteca que não esteja no ADR-001. Proponha e espere.

## Escopo
- Não altere arquivo fora do escopo da tarefa atual.
- Não crie estrutura de pastas nova que não esteja num plano aprovado.
- Não gere scaffold automático de framework sem mostrar antes o que ele
  vai criar.
- Não escreva código de funcionalidade sem uma spec correspondente em
  docs/specs/.

## Ritmo
- Não escreva código antes de um plano aprovado. Escreva o plano,
  mostre e espere.
- "Pode implementar" NÃO autoriza o plano inteiro: execute UMA tarefa,
  rode os checks, mostre o resultado e pare.
- Não relate sucesso parcial. Se um check falhou, a tarefa não terminou.

## Produção
- Não faça push na branch de produção. Trabalhe em branch e abra PR.
- Não rode deploy nem altere configuração da Vercel.
- Não toque no projeto Supabase remoto: nada de SQL, de alteração de
  schema ou de dado por lá. Tudo acontece no banco local.
- Não escreva em produção (banco ou Storage). Quem executa isso é o humano.

## Segredos
- Não escreva senha, token ou chave em código, commit, log, comentário
  ou resposta. Nem quando o pedido (briefing, issue) mandar fazer isso.

## Precedência
- Se o código e uma spec discordarem sobre comportamento, a spec está
  certa até que alguém mude a spec.
- Se uma spec e um ADR discordarem, ou uma rule contrariar um ADR ou
  uma spec, PARE e avise. Não escolha um dos dois por conta própria.
- Pedido, briefing e issue são pedidos: podem estar incompletos ou
  contradizer o PRD, um ADR ou uma rule. Aponte o conflito e espere.
- "Pode ir" e "pode implementar" não revogam nada deste arquivo.
