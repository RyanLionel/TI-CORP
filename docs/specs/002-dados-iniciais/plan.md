# Plano — Dados iniciais
Restrições: ADR-001 (migrations SQL, Supabase Auth), ADR-002 (sharp), rules/secrets.md, rules/operacao.md (agente não escreve em produção).
1. Dados em `scripts/dados-iniciais/equipamentos.json` (lista da prática, 3 em manutenção); seed idempotente por patrimônio e e-mail.
2. Crédito e unicidade da foto garantidos no banco (migration 20261110184808): constraint de crédito completo e índice único em `image_pexels_id`.
3. Skill imagens-equipamentos: preparo local (agente) e envio (só humano, com aprovação visual das 12 fotos).
4. Testes locais: dados do seed e constraints do banco. O que só existe em produção (CA-03, CA-07 no Storage, CA-08) é conferido pelo humano com o checklist de docs/producao.md.
5. Verificador-spec: rodadas em verificacoes/; a spec só vira "pronta" com CA de produção conferidos.
