# Spec — Gatilho obrigatório do verificador

> Status: rascunho. O código não está no repositório e precisa ser recriado (2026-11-16).

## Objetivo
Nenhuma spec é declarada pronta sem uma rodada PRONTA do verificador-spec sobre o código atual, sem depender de alguém lembrar de pedir.

## Vínculo
Prática (Entrega 1, "Obrigatório") · rules/spec-flow.md · .claude/agents/verificador-spec.md

## Regras
1. Spec com `> Status: pronta` exige `verificacoes/rodada-NN.md` com `Veredito: PRONTA` e `Commit: <sha>`.
2. Se `src/ test/ api/ supabase/ scripts/ skills/ prisma/` mudou depois desse commit (inclusive mudança ainda não commitada), a verificação é inválida. (`api/` entrou em 2026-11-16, com a spec 004.)
3. O script roda no pre-commit (`.githooks`, ativado pelo `postinstall`) e como `npm run check:specs`.
4. Limite conhecido: hook local pode ser pulado com `--no-verify`; sem CI no repo isso é o melhor possível sem nova dependência.

## Critérios de aceitação
- CA-01 · Spec em rascunho passa.
- CA-02 · Spec pronta sem rodada é barrada.
- CA-03 · Última rodada NÃO PRONTA barra.
- CA-04 · Rodada PRONTA do commit atual passa.
- CA-05 · Código alterado depois da verificação barra.

## Fora de escopo
CI remoto, bloqueio de `--no-verify`.

## Contrato afetado
Nenhum endpoint. `scripts/checar-specs.mjs`, `.githooks/pre-commit`, `package.json` (postinstall).
