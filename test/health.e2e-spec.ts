import { Test } from '@nestjs/testing'
import { INestApplication } from '@nestjs/common'
import request from 'supertest'
import { AppModule } from '../src/app.module'
import { PrismaService } from '../src/prisma/prisma.service'

describe('GET /health', () => {
  let app: INestApplication

  beforeAll(async () => {
    process.env.DATABASE_URL ??= 'postgresql://postgres:postgres@127.0.0.1:54322/postgres'
    const mod = await Test.createTestingModule({ imports: [AppModule] }).compile()
    app = mod.createNestApplication()
    await app.init()
  })

  afterAll(async () => { await app.close() })

  it('AZ-04: devolve 200 com status e conexão com o banco', async () => {
    const res = await request(app.getHttpServer()).get('/health')
    expect(res.status).toBe(200)
    expect(res.body).toEqual({ status: 'ok', database: 'up' })
  })

  it('AZ-04: devolve 503 com database down quando o banco falha', async () => {
    jest.spyOn(app.get(PrismaService), 'ping').mockRejectedValueOnce(new Error('down'))
    const res = await request(app.getHttpServer()).get('/health')
    expect(res.status).toBe(503)
    expect(res.body).toMatchObject({ status: 'error', database: 'down' })
  })
})
