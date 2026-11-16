---
name: imagens-equipamentos
description: Prepara, revisa e envia as fotos dos equipamentos (spec 002) a partir da API do Pixabay, em 800x600, sem repetir foto e com crédito registrado. Use quando a tarefa for obter, trocar, revisar ou publicar imagem de equipamento. Não use para imagens da landing, logo ou ilustrações.
---

# Imagens dos equipamentos

Contrato: spec 002 (docs/specs/002-dados-iniciais), ADR-002 (sharp). Fonte única: API do Pixabay.
Em conflito, rules/ e docs/adr/ vencem esta skill.

## Quem faz o quê
| etapa | comando | quem roda |
|---|---|---|
| 1. preparar | `npm run imagens:preparar` | agente ou humano (só local: Pixabay e disco) |
| 2. revisar | editar `scripts/dados-iniciais/revisao-imagens.json` | **só o humano** |
| 3. enviar local | `npm run imagens:enviar:local` | agente ou humano (Supabase local) |
| 4. enviar produção | `SEED_CONFIRM_REMOTE=sim npm run imagens:enviar` | **só o humano** (docs/producao.md) |

## Procedimento
1. Confirme `PIXABAY_API_KEY` no `.env` (nunca em arquivo versionado, resposta ou log).
2. Rode `npm run imagens:preparar`. Ele busca cada equipamento pelo campo `busca` de
   `scripts/dados-iniciais/equipamentos.json`, descarta candidatos suspeitos pelas tags, pula fotos já usadas
   ou reprovadas, recorta para 800x600 e confere o tamanho por código. Saída: `tmp/imagens/<patrimonio>.jpg`
   e o crédito em `scripts/dados-iniciais/revisao-imagens.json` com `"aprovada": null`.
   Detalhes da API: references/pixabay.md.
3. PARE e peça a revisão humana das 12 fotos (references/revisao-visual.md). O agente não marca `aprovada`.
4. Foto reprovada (`"aprovada": false` com `motivo`): rode o preparar de novo; ele guarda a reprovada no
   histórico e busca outra.
5. Com as 12 em `"aprovada": true`, o envio sobe as fotos para o bucket público `equipamentos` e grava o
   crédito no banco. Repetir não duplica (objeto = `<patrimonio>.jpg`, sobrescrito).

## Garantido por código (scripts/)
- 800x600: `normalizar` + `verificarDimensoes` no preparar e de novo no envio.
- Sem repetição: `escolher` ignora fotos usadas e reprovadas; o banco tem índice único em `image_source_id`.
- Crédito completo: `credito` monta origem, autor e licença; o banco recusa crédito incompleto.
- Envio só com as 12 aprovadas; destino remoto só com `SEED_CONFIRM_REMOTE=sim`.

## Depende de revisão humana
Pessoa, marca ou logo legível, texto ou tela com conteúdo: a triagem por tags só reduz a chance;
quem decide é a revisão visual (CA-10).

## Não faça
- Não use outra origem de imagem nem link direto do Pixabay na tela (hotlinking não é permitido).
- Não marque `aprovada` no lugar do humano.
- Não rode o envio contra produção.
