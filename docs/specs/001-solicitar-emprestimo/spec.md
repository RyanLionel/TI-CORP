# Spec — Solicitar empréstimo

> Status: pronta (2026-11-16). Código recriado em 2026-11-16; verificação: verificacoes/rodada-06.md (PRONTA, commit 6fa1438). CA-11 conferido no front (spec 001, rodada-02, commit c5c59c3). Erro plantado: rodadas 03 e 04.

## Objetivo
O colaborador logado solicita um equipamento disponível e o empréstimo é criado na hora, sem aprovação.

## Vínculo
PRD: seções Solicitar, Limite, Atraso, Manutenção, Concorrência · ADRs que restringem: ADR-001 (RLS, funções SQL, migrations em SQL).
Código existente: `request_loan` e trigger `enforce_loan_rules` em supabase/migrations/20261001000000_initial_schema.sql.

## Regras
1. Só equipamento com situação `disponivel` e sem empréstimo em aberto pode ser solicitado.
2. O empréstimo é criado com devolução prevista em 14 dias úteis (seg a sex, sem feriados; PRD).
3. Quem já tem 5 empréstimos em aberto (atrasados contam) não pode solicitar outro.
4. Quem tem empréstimo em atraso (`due_at` < agora e sem devolução) não pode solicitar outro. Exige migration nova: o schema atual não impõe isso.
5. Equipamento em manutenção ou já emprestado é recusado.
6. Dois pedidos simultâneos ao mesmo equipamento: só um é criado (índice único `loans_one_open_per_equipment`).
7. Toda recusa devolve o motivo em português: indisponível (em manutenção ou já emprestado), limite atingido, atraso pendente ou equipamento não encontrado.
8. O colaborador só enxerga os próprios empréstimos (RLS `loans_read_borrower_or_operations`).

## API (contrato)
Todas exigem `Authorization: Bearer <token do Supabase Auth>`; sem token ou token inválido: 401.
- `GET /equipments` → lista com `id`, `nome`, `categoria`, `patrimonio`, `situacao` (`disponivel` | `emprestado` | `manutencao`) e `imagem`: `{ url, fotografo, fonte, licenca }` (url pública no Storage) ou `null` (formato fechado por Ryan em 2026-11-16).
- `POST /loans` `{ equipmentId: uuid }` → 201 `{ id, equipmentId, dueAt }`; recusa de regra → 409 com `message` em português; body inválido → 400.
- `GET /loans/me` → empréstimos em aberto do usuário, com `dueAt` e `atrasado`.
O token é validado perguntando ao Supabase Auth (`/auth/v1/user`); as chamadas de `POST /loans` e `GET /loans/me` rodam como o usuário (RLS vale). Exceção: `GET /equipments` lê com a conexão da API para calcular `situacao` (plan.md, item 3), porque a RLS não deixa o colaborador ver empréstimo alheio; só sai o booleano "tem empréstimo em aberto", nenhum dado de outra pessoa.

## Critérios de aceitação
- CA-01 · Solicitar equipamento disponível cria 1 empréstimo com `borrower_id` do usuário logado e `due_at` = agora + 14 dias úteis.
- CA-02 · Após CA-01, o equipamento não aparece mais como disponível.
- CA-03 · Solicitar equipamento em manutenção é recusado com motivo e não cria empréstimo.
- CA-04 · Solicitar equipamento já emprestado é recusado com motivo e não cria empréstimo.
- CA-05 · Com 5 empréstimos em aberto, a 6ª solicitação é recusada com a mensagem de limite.
- CA-06 · Com empréstimo em atraso, qualquer solicitação é recusada com a mensagem de atraso.
- CA-07 · Duas solicitações simultâneas ao mesmo equipamento resultam em exatamente 1 empréstimo.
- CA-08 · Usuário sem autenticação é recusado.
- CA-09 · Um colaborador não lê empréstimos de outro; Operações lê todos.
- CA-10 · `GET /loans/me` devolve só os empréstimos em aberto do usuário, com `dueAt`, e `POST /loans` / `GET /equipments` respeitam 400/401/409 do contrato acima.
- CA-11 · (front, ver spec 001 do repo TI-CORP-frontend) o catálogo mostra "Fotos: Pixabay" com link e as recusas aparecem com o motivo.

## Decisões (Ryan, 2026-11-10)
- Prazo: 14 dias úteis (briefing vence o schema; PRD atualizado). Feriados não contam (PRD, Decisões fechadas, 2026-11-11).
- Limite: 5 em aberto, atrasados contam (PRD atualizado).
- Crédito "Fotos: Pixabay" com link fica na tela (era "Fotos: Pexels" até 2026-11-16; fonte trocada, ver spec 002); o item 9 do briefing ("sem texto de crédito") foi recusado por contrariar o contrato da skill e a exigência da API de mostrar a origem das imagens.
- Mensagens de recusa (propostas pelo agente, revisar): "Equipamento em manutenção", "Equipamento já emprestado", "Limite de 5 empréstimos em aberto atingido", "Você tem empréstimo em atraso".
- Depende da spec 002 (equipamentos e fotos existirem).

## Decisões (Ryan, 2026-11-16, ao aprovar o DDL da T2)
- Dias úteis contados no fuso America/Sao_Paulo (em UTC, um pedido à noite cairia no dia seguinte).
- Ordem das recusas: problema do equipamento (manutenção, já emprestado) antes do problema da pessoa (atraso, limite).
- Corrida entre dois pedidos (CA-07): o índice único `loans_one_open_per_equipment` barra o segundo; a API traduz a violação de unicidade (23505) para 409 "Equipamento já emprestado".

## Decisões (Ryan, 2026-11-16, depois da rodada 04 do verificador)
- Equipamento inexistente (UUID válido, desconhecido): 409 "Equipamento não encontrado", e não 404, porque o contrato só lista 400, 401 e 409; o motivo entra na regra 7.
- `GET /loans/me` devolve só `id`, `equipmentId`, `dueAt` e `atrasado` (contrato); o front cruza com o catálogo para mostrar o nome.
- A exceção de `GET /equipments` (consulta sem `asUser`) fica escrita no contrato.
- Teste novo: empréstimo devolvido não aparece em `GET /loans/me` (lacuna apontada pela rodada 04).

## Fora de escopo / não decidido
Devolução, tela de Operações, cadastro de equipamento, reserva futura, notificação por e-mail, renovação, aprovação e fila. Formato de erro da API ainda não decidido (ADR-001).

## Contrato afetado
Função SQL `request_loan(uuid)`, trigger `enforce_loan_rules` e nova função `add_business_days` (migration 20261116134500_regras_solicitar_emprestimo, sem editar a inicial). Endpoints REST acima. Não pode mudar: políticas RLS existentes de leitura.
