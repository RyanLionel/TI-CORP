# Spec — Dados iniciais (equipamentos, imagens e conta do professor)

> Status: rascunho com decisões fechadas em 2026-11-10. O código desta spec não está no repositório e precisa ser recriado (2026-11-16).
> Depende de: skill `imagens-equipamentos` (a recriar). Bloqueia: spec 001.

## Objetivo
O banco do deploy tem 12 equipamentos com foto e a conta do professor, sem nenhum empréstimo.

## Vínculo
PRD: Equipamentos, Autenticação · ADRs: ADR-001 (Supabase Auth, migrations SQL) · rules: secrets, operacao, migration.

## Regras
1. 12 equipamentos exatamente conforme a lista da prática (patrimônio TI-0001..TI-0012).
2. Situação (decidido pelo Ryan): manutenção = TI-0004, TI-0007 e TI-0010; os outros 9 disponíveis. Vale a lista da prática; o briefing ("10 disponíveis") estava errado.
3. Nenhum empréstimo é criado pelo seed.
4. Cada equipamento tem 1 imagem 800x600 vinda só da API do Pixabay, sem repetir foto entre equipamentos.
5. Cada imagem tem crédito registrado (origem, autor, licença). Decidido: colunas novas em `equipments` (`image_path`, `image_source_id`, `image_photographer`, `image_source_url`, `image_license`), com índice único em `image_source_id` (CA-05 garantido no banco). Licença registrada: "Pixabay Content License". Nome genérico (`image_source_id`, não `image_pixabay_id`) para não exigir migration nova se a fonte mudar. Migration `20261116193000_equipamento_imagem_credito` (DDL aprovado por Ryan em 2026-11-16).
6. Imagens em bucket público do Supabase Storage (`equipamentos`); chave do objeto derivada do patrimônio, para repetir não duplicar. O bucket é criado pelo script de envio se não existir (2026-11-16: fora da migration, porque no local o Storage pode estar desligado durante o `db reset`).
7. Usuário marcelo.grilo@institutojef.org.br criado via Supabase Auth, com zero empréstimos. Decidido: `scripts/seed-dados-iniciais.mjs` (Admin API), que o Ryan roda em produção. A senha vem de variável de ambiente; NÃO vai em arquivo versionado (conflita com o briefing item 5 e com rules/secrets.md).
8. Seed idempotente: rodar 2x não duplica equipamento, usuário, objeto no Storage nem crédito (chave natural = patrimônio).
9. O agente só prepara scripts e imagens locais. Quem executa contra o Supabase do deploy é o Ryan.
10. Redimensionar para 800x600: Decidido: `sharp` aprovado e registrado no ADR-002 (devDependency, só no script de preparo; instalada junto da skill). O tamanho tem de ser garantido por código (verificação de dimensões), não por instrução.

## Critérios de aceitação
- CA-01 · Existem exatamente 12 equipamentos com os patrimônios, nomes e categorias da lista.
- CA-02 · A situação de cada um bate com a decisão da regra 2 registrada nesta spec.
- CA-03 · Todo equipamento tem imagem acessível por URL pública sem login.
- CA-04 · Todas as imagens têm 800x600.
- CA-05 · Não há duas imagens com o mesmo ID de foto do Pixabay.
- CA-06 · Cada imagem tem crédito com origem (Pixabay), autor e licença (Pixabay Content License).
- CA-07 · Rodar o seed duas vezes mantém 12 equipamentos, 12 objetos no Storage e 1 usuário.
- CA-08 · O usuário do professor autentica e tem 0 empréstimos.
- CA-09 · Nenhuma senha, token ou chave aparece no repositório nem no histórico do git.
- CA-10 · A revisão visual humana aprovou as 12 fotos (sem pessoa, marca/logo legível, texto ou tela com conteúdo). Fotos reprovadas e motivo ficam registrados.

## Decisões (Ryan, 2026-11-16)
- Fonte das imagens trocada de Pexels para Pixabay por orientação do professor (motivo: o Pexels não vai poder ser usado). Contraria o contrato da Entrega 2 da prática, que exigia só a API do Pexels; registrar em ENTREGA.md, seção 1.
- A API do Pixabay não permite hotlinking: as imagens são baixadas e servidas do bucket do Supabase (regra 6, sem mudança).
- A tela que exibe as fotos mostra "Fotos: Pixabay" com link (a API pede que o usuário veja de onde vieram as imagens). PRD e spec 001 atualizados.
- Chave em `PIXABAY_API_KEY`: `.env` local e `.env.example` (sem valor). Não vai ao painel da Vercel: só os scripts de preparo, rodados localmente, usam a chave.

## Fora de escopo
Tela de catálogo, cadastro pela interface, importação de planilha.
