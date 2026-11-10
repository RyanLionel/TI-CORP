import { z } from 'zod'

const schema = z.object({
  DATABASE_URL: z.string().min(1, 'DATABASE_URL não definida (ver .env.example)'),
  PORT: z.coerce.number().int().positive().default(3000),
  FRONT_ORIGIN: z.string().optional(),
})

export type Env = z.infer<typeof schema>

export function loadEnv(source: NodeJS.ProcessEnv = process.env): Env {
  const parsed = schema.safeParse(source)
  if (!parsed.success) {
    const msg = parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; ')
    throw new Error(`Configuração inválida: ${msg}`)
  }
  return parsed.data
}
