> Rodada 2 · resposta literal do subagente verificador-spec, aberto como agente novo, sem o contexto da sessão principal (plano B da aula 11).
> Adaptação de harness (2026-11-16): os checks foram executados pelo Ryan no HEAD e entregues ao subagente como evidência; ele leu código e testes só em modo leitura.
> A rodada 01 cita o commit 2729de5, que não existe no remoto: vale só como histórico.

Spec: docs/specs/002-dados-iniciais/spec.md · Rodada: 2 · Commit: 9cd74fca2f61bdb55bfb56a55e50d7caaec0dce1 · Árvore: limpa

| CA | evidência (arquivo:linha do teste) | status | observação |
|---|---|---|---|
| CA-01 | test/seed-dados-iniciais.e2e-spec.ts:49 | ATENDIDO | Atendido no banco local. O teste compara o banco com `scripts/dados-iniciais/equipamentos.json`. A "lista da prática" original não está no repositório, então não consegui conferir se o JSON é igual a ela. Em produção, ainda não foi rodado. |
| CA-02 | test/seed-dados-iniciais.e2e-spec.ts:56 | ATENDIDO | Atendido no banco local: TI-0004, TI-0007 e TI-0010 em manutenção e 9 disponíveis. Em produção, ainda não foi rodado. |
| CA-03 | test/imagens-envio.e2e-spec.ts:68 | SEM TESTE | O teste só prova o mecanismo (bucket público e URL sem login) com 2 objetos `TESTE-*` no Storage local. Nenhum teste e nenhuma execução mostram que os 12 equipamentos reais têm imagem acessível: o seed não envia fotos e a prova depende do Storage de produção, que ainda não foi feito. |
| CA-04 | src/imagens/imagens.spec.ts:11, :23; test/imagens-envio.e2e-spec.ts:76 | ATENDIDO | O tamanho é garantido por código: `verificarDimensoes` roda no preparo e de novo antes de cada envio (`enviar-imagens.mjs:76`). Os testes usam imagens sintéticas, e as 12 fotos reais não estão versionadas. |
| CA-05 | test/imagens-banco.e2e-spec.ts:53; src/imagens/imagens.spec.ts:27, :37 | ATENDIDO | O índice único `equipments_image_source_id_unique` foi testado no banco local. O envio recusa foto repetida (`enviar-imagens.mjs:52`). Os 12 `source_id` de `revisao-imagens.json` são distintos (conferi lendo o arquivo; nenhum teste olha esse arquivo). |
| CA-06 | test/imagens-banco.e2e-spec.ts:38, :43; src/imagens/imagens.spec.ts:51; test/imagens-envio.e2e-spec.ts:82 | ATENDIDO | O banco exige crédito completo. As 12 entradas de `revisao-imagens.json` têm autor, URL do pixabay.com e "Pixabay Content License". O banco não obriga o valor da licença, só que ela exista. `docs/producao.md` e `plan.md` citam a migration `20261110184808` e `image_pexels_id`, que não existem; a migration certa é `20261116193000`. |
| CA-07 | test/seed-dados-iniciais.e2e-spec.ts:65; test/imagens-envio.e2e-spec.ts:82 | ATENDIDO | No local, o seed rodado 2x dá 12 equipamentos e 1 usuário. No Storage, o envio 2x dá 1 objeto por item, mas o teste usa só 2 itens `TESTE-*`, não os 12. Os "12 objetos" reais dependem de produção, que ainda não foi feito. |
| CA-08 | test/seed-dados-iniciais.e2e-spec.ts:76 | ATENDIDO | No Auth local, a conta do professor autentica (HTTP 200) e tem 0 empréstimos. A conta em produção ainda não foi criada. |
| CA-09 | nenhum | SEM TESTE | Nenhum teste cita o CA-09. Fiz uma varredura manual com `git log -p --all` e `git ls-files`: só achei a credencial padrão do Postgres local (`postgres:postgres@127.0.0.1`) e os placeholders do `.env.example`. Não há `.env` versionado. |
| CA-10 | test/imagens-envio.e2e-spec.ts:98; src/imagens/imagens.spec.ts:43 | ATENDIDO | `scripts/dados-iniciais/revisao-imagens.json` (commit ee66ff0, autor RyanLionel) traz as 12 fotos com `aprovada: true` e as reprovadas com motivo. O envio recusa se faltar aprovação. A exceção da TI-0012 (nome da lente legível com zoom) está registrada só na spec; no JSON o `motivo` está vazio. A URL da TI-0004 cita "surface-book-microsoft": não vi a imagem, convém o humano confirmar que não há logo legível. T5 continua desmarcada em tasks.md. |

Checks: npm test → passou (rodado pelo humano no HEAD depois de `npm run db:reset`, não neste harness: 10 suítes e 60 testes passando)
Checks: npm run build → passou (rodado pelo humano, não neste harness)
Checks: git status --short → passou (vazio; conferido aqui também)
Fora de escopo: nada encontrado. O campo `imagem` no GET /equipments está previsto na T2.
Veredito: NÃO PRONTA — o CA-03 não tem prova sobre os 12 equipamentos reais e o CA-09 não tem teste; além disso, seed, Storage e conta do professor ainda não rodaram em produção, e o plan.md (passo 5) exige isso antes de a spec ficar pronta.
