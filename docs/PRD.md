# PRD — EMPREST.AI

**Solicitante:** Operações de TI
**Time responsável:** Engenharia
**Status:** rascunho derivado de `layout.md` (repo front) e do schema inicial. Regras marcadas com (confirmar) precisam de validação do negócio.

## Contexto
A TI interna empresta equipamentos (notebooks, monitores, cabos, câmeras e
acessórios) a colaboradores. Hoje o controle é manual, em planilha, e não
mostra quem está com o quê nem o que está atrasado.

## O que o sistema precisa fazer

**Acesso.** Duas pessoas entram no sistema: o Colaborador e a pessoa de Operações.
Cada pessoa vê apenas os próprios empréstimos; só Operações vê todos.

**Catálogo.** O colaborador vê os equipamentos, com situação: disponível,
emprestado ou em manutenção. Pode buscar por nome e patrimônio e filtrar por situação.

**Solicitar.** O colaborador solicita um equipamento disponível e o empréstimo
nasce na hora, sem aprovação. O prazo de devolução é de 14 dias (confirmar: corridos ou úteis).

**Limite.** Cada pessoa pode ter no máximo 3 equipamentos emprestados ao mesmo tempo (confirmar).

**Atraso.** Quem tem empréstimo em atraso não pode solicitar outro (confirmar).

**Manutenção.** Equipamento em manutenção não pode ser solicitado. Equipamento
emprestado não pode ir para manutenção.

**Devolver.** O colaborador devolve o próprio empréstimo; Operações registra
devolução de qualquer empréstimo, no balcão.

**Operações.** Operações vê os empréstimos em aberto, com indicadores
(em aberto, em atraso, disponíveis, manutenção), e cadastra novos equipamentos
(nome, categoria, patrimônio, observações, situação inicial).

**Concorrência.** Dois pedidos ao mesmo equipamento ao mesmo tempo: só um é criado.

## Restrições
- Sistema interno, uso por colaboradores identificados (login corporativo).
- Cada equipamento tem patrimônio único quando informado.
- Interface e mensagens em português do Brasil.

## Fora de escopo nesta versão
- Reserva com data futura
- Notificação por e-mail
- Importação da planilha
- Renovação de empréstimo
- Fluxo de aprovação e fila de espera

## Perguntas em aberto
1. Prazo de 14 dias: corridos ou úteis? (o schema atual usa corridos)
2. Limite de empréstimos em aberto: 3 (layout e schema)? Confirmar com Operações.
3. O bloqueio por atraso ainda não está no schema (só o limite e a disponibilidade são impostos); entra na spec de solicitar.
4. Quem define o papel Operações e como ele é concedido?
---
Este documento descreve o que o negócio precisa. Decisões de tecnologia,
modelagem e arquitetura são responsabilidade da engenharia (ver docs/adr/).
