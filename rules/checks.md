---
description: O que precisa passar antes de declarar uma tarefa pronta
globs: []
alwaysApply: true
---

# Verificação de fim de tarefa
> leitor: agente

## Quando
Sempre que você for dizer "pronto", "implementado" ou "funcionando".

## Procedimento
1. Testes: rode `npm test` (banco local de pé: `npm run db:up`) e cole a última linha
   da saída.
2. Se a tarefa tocou em migration, rode `supabase db reset` local e
   confirme que o banco sobe do zero com todas as migrations. Se a CLI
   não estiver instalada, diga isso e não declare a migration verificada.
3. Rode `npm run build` antes de qualquer push. Build que quebra na Vercel é o feedback mais lento e
   mais caro deste projeto.
4. Rode `git status --short`. Só podem aparecer arquivos do escopo
   da tarefa.
5. Diga qual critério de aceitação (CA-xx) esta tarefa atende.

## Verificação
Pronto = os comandos aplicáveis terminaram sem falha E o git status não
trouxe surpresa. As duas coisas, não uma.

## Não faça
- Não relate sucesso parcial. Teste vermelho é tarefa não terminada,
  mesmo que o código "esteja certo".
- Não tente consertar a mesma falha duas vezes seguidas sem me mostrar
  a saída do erro.
- Não rode teste contra o banco remoto.
