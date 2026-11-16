# Plano — Gatilho obrigatório do verificador

Restrições: `rules/spec-flow.md`, `rules/checks.md`, `rules/operacao.md`. Sem dependência nova e sem CI remoto (fora de escopo da spec).

1. `scripts/checar-specs.mjs` lê cada spec com `> Status: pronta` e exige `verificacoes/rodada-NN.md` com `Veredito: PRONTA` e `Commit:` do código atual. Rascunho passa. Rodada ausente, `NÃO PRONTA` ou código mudado depois em `src/`, `test/`, `supabase/`, `scripts/`, `skills/` ou `prisma/` barra (CA-01 a CA-05).
2. `.githooks/pre-commit` chama o script. `postinstall` aponta `core.hooksPath` para `.githooks`. `npm run check:specs` é o mesmo comando fora do git.
3. `src/specs/checar-specs.spec.ts` cobre os cinco critérios pelo nome do CA.
4. A delegação continua no passo 6 de `rules/spec-flow.md`, para `.claude/agents/verificador-spec.md`. Quem corrige é o agente principal.
