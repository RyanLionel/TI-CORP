// Spec 002 · skill imagens-equipamentos: funções que garantem o contrato por código.
import sharp from 'sharp'

// eslint-disable-next-line @typescript-eslint/no-require-imports
const lib = require('../../skills/imagens-equipamentos/scripts/lib.cjs')

const img = (w: number, h: number) =>
  sharp({ create: { width: w, height: h, channels: 3, background: '#888' } }).jpeg().toBuffer()

describe('skill imagens-equipamentos (spec 002)', () => {
  it('CA-04: normaliza qualquer proporção para exatamente 800x600', async () => {
    for (const [w, h] of [
      [1920, 1080],
      [500, 900],
      [800, 600],
      [3000, 3000],
    ]) {
      const out = await lib.normalizar(await img(w, h))
      await expect(lib.verificarDimensoes(out)).resolves.toBeUndefined()
    }
  })

  it('CA-04: verificarDimensoes reprova imagem que não é 800x600', async () => {
    await expect(lib.verificarDimensoes(await img(799, 600))).rejects.toThrow('esperado 800x600')
  })

  it('CA-05: escolher nunca devolve foto já usada nem reprovada', () => {
    const c = [
      { id: 1, tags: 'laptop' },
      { id: 2, tags: 'laptop' },
      { id: 3, tags: 'laptop' },
    ]
    expect(lib.escolher(c, { usadas: new Set(['1']), reprovadas: new Set(['2']) }).id).toBe(3)
    expect(lib.escolher(c, { usadas: new Set(['1', '2', '3']), reprovadas: new Set() })).toBeNull()
  })

  it('CA-10: a triagem descarta tags com pessoa, mão, marca ou texto', () => {
    expect(lib.tagsSuspeitas('laptop, man, office')).toBe(true)
    expect(lib.tagsSuspeitas('hands, typing, keyboard')).toBe(true)
    expect(lib.tagsSuspeitas('macbook, desk')).toBe(true)
    expect(lib.tagsSuspeitas('laptop, desk, white')).toBe(false)
    expect(lib.escolher([{ id: 7, tags: 'woman, laptop' }], { usadas: new Set(), reprovadas: new Set() })).toBeNull()
  })

  it('CA-06: crédito guarda origem, autor e licença do Pixabay', () => {
    expect(lib.credito({ id: 9, user: 'Ana', pageURL: 'https://pixabay.com/photos/x-9/' })).toEqual({
      source_id: '9',
      fotografo: 'Ana',
      source_url: 'https://pixabay.com/photos/x-9/',
      licenca: 'Pixabay Content License',
    })
  })

})
