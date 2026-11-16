import {
  CanActivate,
  ExecutionContext,
  Injectable,
  InternalServerErrorException,
  ServiceUnavailableException,
  UnauthorizedException,
} from '@nestjs/common'
import { loadEnv } from '../config/env'

export type AuthUser = { id: string }

// Valida o token perguntando ao Supabase Auth (/auth/v1/user), como manda o contrato da spec 001.
@Injectable()
export class SupabaseAuthGuard implements CanActivate {
  async canActivate(ctx: ExecutionContext): Promise<boolean> {
    const req = ctx.switchToHttp().getRequest<{ headers: Record<string, unknown>; user?: AuthUser }>()
    const header = req.headers['authorization']
    const match = typeof header === 'string' ? /^Bearer\s+(\S+)$/i.exec(header) : null
    if (!match) throw new UnauthorizedException('Autenticação obrigatória')

    const { SUPABASE_URL, SUPABASE_ANON_KEY } = loadEnv()
    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) throw new InternalServerErrorException('Autenticação não configurada')

    let res: Response
    try {
      res = await fetch(`${SUPABASE_URL.replace(/\/$/, '')}/auth/v1/user`, {
        headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${match[1]}` },
      })
    } catch {
      throw new ServiceUnavailableException('Serviço de autenticação indisponível')
    }
    if (!res.ok) throw new UnauthorizedException('Sessão inválida')
    const user = (await res.json()) as { id?: string }
    if (!user.id) throw new UnauthorizedException('Sessão inválida')

    req.user = { id: user.id }
    return true
  }
}
