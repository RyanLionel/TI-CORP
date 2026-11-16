# ADR-002 — sharp para redimensionar imagens (800x600)

**Status:** aceito (aprovado pelo Ryan em 2026-11-10; texto redigido pelo agente, revisar)
**Negócio:** docs/specs/002-dados-iniciais

> Texto atualizado em 2026-11-16: a fonte das imagens passou de Pexels para Pixabay (spec 002). A decisão (sharp) não mudou.

## Contexto
A skill `imagens-equipamentos` precisa entregar todas as imagens em 800x600, e isso
tem de ser garantido por código, não por instrução. O ADR-001 não lista biblioteca
de imagem e rules/operacao.md manda pedir antes de instalar dependência.

## Decisão
Usar `sharp` (versão exata, fixada no package.json) apenas em script de preparo local
das imagens (devDependency). Não entra no runtime da API. O script falha se alguma
imagem de saída não medir exatamente 800x600.

## Alternativas consideradas
- **Sem biblioteca** (usar o tamanho que a API do Pixabay já entrega): a API devolve tamanhos próprios e não garante 800x600 nem a proporção; não dá garantia por código.
- **ImageMagick no sistema:** depende de instalação na máquina de cada pessoa e foge do controle de versão do projeto.
- **Jimp (JS puro):** sem binário nativo, mas mais lento e menos mantido.

## Consequências
- Binário nativo baixado no `npm install`; atrás do Zscaler pode precisar do CA corporativo.
- Cortar para 800x600 usa `fit: cover`; a revisão visual humana confere se o recorte não estragou a foto.
- Versão: 0.35.5 (publicada em 2026-09-27, fora da janela de 7 dias da regra de dependências).
