# Spec — Devolver empréstimo

> Status: rascunho (2026-11-17). Aprovada pelo Ryan em 2026-11-17 ("aprovo"); código escrito, aguardando checks e verificador. Pedido do Ryan: "preciso da devolução".

## Objetivo
O colaborador devolve, pelo sistema, um empréstimo próprio que está em aberto, e o equipamento volta a ficar disponível.

## Vínculo
docs/PRD.md ("Devolver") · spec 001 (que deixou a devolução fora de escopo) · função `public.return_loan`, que já existe no schema inicial · front: spec 003-devolver-emprestimo

## Regras
1. A devolução usa a função `public.return_loan(p_loan_id)`, que já existe no banco: grava `returned_at = now()` e `returned_by = quem devolveu`. Não há migration nova.
2. Só quem pegou o empréstimo pode devolvê-lo por esta rota. A função também aceita Operações, mas esta spec não cria tela de Operações.
3. A chamada roda como o usuário logado (`asUser`), igual a `POST /loans`.
4. Depois da devolução, o empréstimo some de `GET /loans/me` e o equipamento aparece como `disponivel` em `GET /equipments`.
5. As mensagens de recusa vêm do banco e chegam ao front sem reescrita.

## Critérios de aceitação
- CA-01 · `POST /loans/:id/return` com um empréstimo próprio em aberto devolve 200 `{ id, returnedAt }`. No banco, `returned_at` e `returned_by` ficam preenchidos.
- CA-02 · Depois de devolver, o empréstimo não aparece em `GET /loans/me` e o equipamento volta a `disponivel` em `GET /equipments`. Ele pode ser solicitado de novo.
- CA-03 · Devolver o empréstimo de outra pessoa devolve 403 "Sem permissão para registrar esta devolução".
- CA-04 · Devolver um empréstimo já devolvido devolve 409 "Empréstimo já devolvido".
- CA-05 · Id que não existe devolve 404 "Empréstimo não encontrado". Id que não é UUID devolve 400 "id deve ser um UUID".
- CA-06 · Sem token, ou com token inválido, devolve 401 (mesmo guard das outras rotas).
- CA-07 · Devolver libera vaga no limite: quem tinha 5 em aberto, devolve 1 e consegue solicitar outro.

## Fora de escopo
Tela de Operações e devolução no balcão, devolução parcial, motivo ou estado do equipamento na devolução, avisos por e-mail.

## Contrato afetado
Novo: `POST /loans/:id/return` → 200 `{ id, returnedAt }` | 400 | 401 | 403 | 404 | 409, todos com `{ message }`.
