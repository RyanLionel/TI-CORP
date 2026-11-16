# Tarefas — Dados iniciais
> 2026-11-16: skill, migration e scripts não estão em nenhum repositório. Tarefas desmarcadas para recriar.
> A rodada 01 em verificacoes/ cita o commit 2729de5, que não existe no remoto: será refeita.
- [x] T0 · Responder os [DECIDIR] da spec (situação, crédito, usuário, sharp)
- [ ] T1 · Skill imagens-equipamentos (skills/imagens-equipamentos)
- [ ] T2 · Migration 20261116193000_equipamento_imagem_credito (CA-05, CA-06) + campo `imagem` no GET /equipments; test/imagens-banco.e2e-spec.ts e loans-api — DDL aprovado em 2026-11-16; escritos, falta `npm test`
- [x] T3 · Seed idempotente: scripts/seed-dados-iniciais.mjs + scripts/dados-iniciais/equipamentos.json; test/seed-dados-iniciais.e2e-spec.ts (CA-01, CA-02, CA-07, CA-08 no local) — `npm test`: 5 suítes, 38 testes passando; `npm run seed:local` deixou 12 equipamentos, 3 em manutenção (2026-11-16). Ryan executa em produção. Lacuna: a regra 3 (nenhum empréstimo) não tem CA próprio.
- [ ] T4 · Scripts de preparo e envio das imagens; instalar sharp exige aprovação (ADR-002, rules/operacao.md)
- [ ] T5 · Revisão visual humana das fotos
- [ ] T6 · Verificador-spec e relatório (CA-01 a CA-10)
