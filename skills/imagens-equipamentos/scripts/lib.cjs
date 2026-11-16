// Funções puras da skill imagens-equipamentos (spec 002). Testadas em src/imagens/imagens.spec.ts.
const sharp = require('sharp')

const LARGURA = 800
const ALTURA = 600
const LICENCA = 'Pixabay Content License'
const BUCKET = 'equipamentos'

// CA-04: qualquer proporção vira exatamente 800x600 (recorte "cover"; a revisão humana confere o recorte).
async function normalizar(buffer) {
  return sharp(buffer)
    .rotate()
    .resize(LARGURA, ALTURA, { fit: 'cover', position: 'attention' })
    .jpeg({ quality: 82, mozjpeg: true })
    .toBuffer()
}

// CA-04: garantia por código, não por instrução.
async function verificarDimensoes(buffer) {
  const { width, height } = await sharp(buffer).metadata()
  if (width !== LARGURA || height !== ALTURA) throw new Error(`esperado 800x600, veio ${width}x${height}`)
}

// CA-10 (triagem): tags do Pixabay que indicam pessoa, marca, texto ou tela com conteúdo.
// Só reduz a chance; quem decide é a revisão humana.
const SUSPEITAS =
  /\b(people|person|man|men|woman|women|girl|boy|child|children|kid|hand|hands|finger|fingers|face|portrait|selfie|business ?man|business ?woman|logo|brand|apple|macbook|iphone|samsung|dell|lenovo|asus|acer|hp|sony|canon|nikon|text|typing|code|coding|programming|website|web|app|social media|screen ?shot)\b/i

function tagsSuspeitas(tags) {
  return SUSPEITAS.test(String(tags ?? ''))
}

// CA-05: nunca devolve foto já usada em outro equipamento nem reprovada antes.
function escolher(candidatos, { usadas, reprovadas }) {
  for (const c of candidatos) {
    const id = String(c.id)
    if (usadas.has(id) || reprovadas.has(id) || tagsSuspeitas(c.tags)) continue
    return c
  }
  return null
}

// CA-06: origem, autor e licença de cada imagem.
function credito(hit) {
  return { source_id: String(hit.id), fotografo: hit.user, source_url: hit.pageURL, licenca: LICENCA }
}

// Regra 6: chave do objeto derivada do patrimônio, para repetir sem duplicar.
function caminhoObjeto(patrimonio) {
  return `${patrimonio}.jpg`
}

function urlBusca(key, termo) {
  const p = new URLSearchParams({
    key,
    q: termo,
    image_type: 'photo',
    orientation: 'horizontal',
    safesearch: 'true',
    min_width: String(LARGURA),
    min_height: String(ALTURA),
    per_page: '50',
  })
  return `https://pixabay.com/api/?${p}`
}

module.exports = { LARGURA, ALTURA, LICENCA, BUCKET, normalizar, verificarDimensoes, tagsSuspeitas, escolher, credito, caminhoObjeto, urlBusca }
