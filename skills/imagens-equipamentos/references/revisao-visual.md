# Revisão visual (humana) — CA-10

Leia ao revisar as fotos em `tmp/imagens/`. Quem revisa é uma pessoa; o agente não decide.

Reprove (`"aprovada": false`) a foto que tiver qualquer um destes:
- pessoa, rosto, mão ou parte do corpo;
- marca ou logo legível (fabricante, adesivo, etiqueta);
- texto legível;
- tela ligada com conteúdo (site, código, app, foto).

Também reprove se o objeto não corresponde ao equipamento (ex.: cabo USB numa foto de "HDMI") ou se o recorte
800x600 cortou o objeto.

Como registrar em `scripts/dados-iniciais/revisao-imagens.json`:
```json
"TI-0005": { "aprovada": false, "motivo": "logo do fabricante legível na moldura", ... }
```
Aprovada: `"aprovada": true` e `"motivo": ""`. Reprovadas antigas ficam em `reprovadas[]` (histórico,
vai para o ENTREGA.md, seção 4).
