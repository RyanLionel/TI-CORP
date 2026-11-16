import { createServer, Server } from 'node:http'
import request from 'supertest'
import handler, { encerrar } from '../api/index'

// Spec 004 (CA-01/CA-02): o handler da Vercel atende pelo mesmo Nest, sem listen(). Banco LOCAL (rules/tests.md).
describe('handler serverless da Vercel (spec 004)', () => {
  let server: Server
  beforeAll(() => {
    process.env.DATABASE_URL = 'postgresql://postgres:postgres@127.0.0.1:54322/postgres'
    server = createServer((req, res) => { handler(req, res).catch(() => { res.statusCode = 500; res.end() }) })
  })
  afterAll(async () => {
    await new Promise((r) => server.close(() => r(undefined)))
    await encerrar()
  })

  it('CA-01: GET /health pelo handler devolve 200 com status e banco', async () => {
    const res = await request(server).get('/health')
    expect(res.status).toBe(200)
    expect(res.body).toEqual({ status: 'ok', database: 'up' })
  })

  it('CA-02: rota protegida pelo handler devolve 401 sem token', async () => {
    const res = await request(server).get('/equipments')
    expect(res.status).toBe(401)
    expect(res.body.message).toBe('Autenticação obrigatória')
  })
})
