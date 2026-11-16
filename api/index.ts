// Spec 004 · ADR-003: função serverless da Vercel. Sobe o Nest uma vez por instância (init, sem listen)
// e entrega cada requisição ao Express do próprio Nest. `vercel.json` reescreve todas as rotas para cá.
import 'reflect-metadata'
import type { IncomingMessage, ServerResponse } from 'node:http'
import { NestFactory } from '@nestjs/core'
import { AppModule } from '../src/app.module'
import { loadEnv } from '../src/config/env'

type Handler = (req: IncomingMessage, res: ServerResponse) => void

let pronto: Promise<Handler> | undefined

async function iniciar(): Promise<Handler> {
  const env = loadEnv()
  const app = await NestFactory.create(AppModule, { logger: ['error', 'warn'] })
  if (env.FRONT_ORIGIN) app.enableCors({ origin: env.FRONT_ORIGIN })
  await app.init()
  return app.getHttpAdapter().getInstance() as Handler
}

export default async function handler(req: IncomingMessage, res: ServerResponse): Promise<void> {
  pronto ??= iniciar()
  const express = await pronto
  express(req, res)
}
