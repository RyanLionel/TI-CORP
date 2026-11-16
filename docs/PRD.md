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

**Catálogo.** O colaborador vê os equipamentos, com foto e crédito "Fotos: Pixabay" (link) e situação: disponível,
emprestado ou em manutenção. Pode buscar por nome e patrimônio e filtrar por situação.

**Solicitar.** O colaborador solicita um equipamento disponível e o empréstimo
nasce na hora, sem aprovação. O prazo de devolução é de 14 dias úteis (segunda a sexta, sem considerar feriados; decidido por Ryan em 2026-11-10 e confirmado em 2026-11-11).

**Limite.** Cada pessoa pode ter no máximo 5 equipamentos em aberto ao mesmo tempo, contando os que estão em atraso (decidido por Ryan em 2026-11-10).

**Atraso.** Quem tem empréstimo em atraso não pode solicitar outro.

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
Nenhuma no momento.

## Decisões fechadas
- Prazo de 14 dias úteis, limite de 5 empréstimos em aberto (atrasados contam), bloqueio por atraso.
- Feriados não entram na contagem dos 14 dias úteis (só sábado e domingo; Ryan delegou e o agente decidiu em 2026-11-11, revisar). Motivo: não há calendário de feriados na stack e o prazo é folga, não cobrança. Se o negócio exigir feriados, vira spec nova com tabela de feriados.
- Papel Operações: não se concede pela aplicação nesta versão. Quem administra o Supabase atribui `role = 'operacoes'` em `profiles` por migration ou SQL do humano; todo usuário nasce Colaborador (default do schema). Motivo: auto-concessão pela API abriria escalada de privilégio, e a tela de Operações está fora do escopo (Ryan delegou, agente decidiu em 2026-11-11, revisar).
- Dados iniciais: 12 equipamentos, 3 em manutenção (TI-0004, TI-0007, TI-0010).
- Fotos dos equipamentos vêm do Pixabay, com crédito "Fotos: Pixabay" na tela (Ryan, 2026-11-16, por orientação do professor; antes era Pexels).

---
Este documento descreve o que o negócio precisa. Decisões de tecnologia,
modelagem e arquitetura são responsabilidade da engenharia (ver docs/adr/).
