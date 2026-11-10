import { loadEnv } from './env'

describe('loadEnv', () => {
  it('AZ-02: falha com mensagem clara quando DATABASE_URL não existe', () => {
    expect(() => loadEnv({})).toThrow(/Configuração inválida: DATABASE_URL/)
  })

  it('AZ-07: lê a configuração da variável de ambiente', () => {
    expect(loadEnv({ DATABASE_URL: 'postgresql://x' })).toMatchObject({ DATABASE_URL: 'postgresql://x', PORT: 3000 })
  })
})
