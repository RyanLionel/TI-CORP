# Spec — Solicitar empréstimo

> Status: rascunho. Itens marcados (confirmar) dependem das perguntas em aberto de docs/PRD.md.

## Objetivo
O colaborador logado solicita um equipamento disponível e o empréstimo é criado na hora, sem aprovação.

## Vínculo
PRD: seções Solicitar, Limite, Atraso, Manutenção, Concorrência · ADRs que restringem: ADR-001 (RLS, funções SQL, migrations em SQL).
Código existente: `request_loan` e trigger `enforce_loan_rules` em supabase/migrations/20261001000000_initial_schema.sql.

## Regras
1. Só equipamento com situação `disponivel` e sem empréstimo em aberto pode ser solicitado.
2. O empréstimo é criado com devolução prevista em 14 dias corridos (confirmar: corridos ou úteis).
3. Quem já tem 3 empréstimos em aberto não pode solicitar outro (confirmar: 3 ou 5).
4. Quem tem empréstimo em atraso (`due_at` < agora e sem devolução) não pode solicitar outro. Exige migration nova: o schema atual não impõe isso.
5. Equipamento em manutenção ou já emprestado é recusado.
6. Dois pedidos simultâneos ao mesmo equipamento: só um é criado (índice único `loans_one_open_per_equipment`).
7. Toda recusa devolve o motivo em português: indisponível, limite atingido ou atraso pendente.
8. O colaborador só enxerga os próprios empréstimos (RLS `loans_read_borrower_or_operations`).

## Critérios de aceitação
- CA-01 · Solicitar equipamento disponível cria 1 empréstimo com `borrower_id` do usuário logado e `due_at` = agora + 14 dias.
- CA-02 · Após CA-01, o equipamento não aparece mais como disponível.
- CA-03 · Solicitar equipamento em manutenção é recusado com motivo e não cria empréstimo.
- CA-04 · Solicitar equipamento já emprestado é recusado com motivo e não cria empréstimo.
- CA-05 · Com 3 empréstimos em aberto, a 4ª solicitação é recusada com a mensagem de limite.
- CA-06 · Com empréstimo em atraso, qualquer solicitação é recusada com a mensagem de atraso.
- CA-07 · Duas solicitações simultâneas ao mesmo equipamento resultam em exatamente 1 empréstimo.
- CA-08 · Usuário sem autenticação é recusado.
- CA-09 · Um colaborador não lê empréstimos de outro; Operações lê todos.

## Fora de escopo / não decidido
Devolução, tela de Operações, cadastro de equipamento, reserva futura, notificação por e-mail, renovação, aprovação e fila. Formato de erro da API ainda não decidido (ADR-001).

## Contrato afetado
Função SQL `request_loan(uuid)` e trigger `enforce_loan_rules` (nova migration, sem editar a inicial). Endpoint REST de solicitação a definir no plano. Não pode mudar: políticas RLS existentes de leitura.
