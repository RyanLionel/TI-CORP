# API do Pixabay — o que a skill usa

Leia só quando o SKILL.md mandar (passo 2) ou ao mexer em `scripts/preparar-imagens.mjs`.

- Busca: `GET https://pixabay.com/api/?key=<PIXABAY_API_KEY>&q=<busca>` com `image_type=photo`,
  `orientation=horizontal`, `safesearch=true`, `min_width=800`, `min_height=600`, `per_page=50`.
- Campos usados de cada resultado (`hits[]`): `id` (vira `image_source_id`), `user` (autor), `pageURL`
  (origem), `tags` (triagem), `largeImageURL` (download; ~1280 px, suficiente para 800x600).
  `webformatURL` tem no máximo 640 px: não serve para 800x600.
- Licença registrada: "Pixabay Content License".
- Sem hotlinking: a imagem é baixada e servida do nosso bucket (Supabase Storage).
- A tela que exibe as fotos mostra a origem: "Fotos: Pixabay" com link.
- Limite padrão: 100 requisições a cada 60 s; o script espera entre buscas. Nada de download em massa.
