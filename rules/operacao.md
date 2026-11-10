---
description: Contrato de operação entre o humano e o agente (RASCUNHO, revisar)
globs: []
alwaysApply: true
---

# Contrato de operação
> leitor: agente (seções 1 e 2) · operador humano (seção 3)

## 1. Quem aperta o botão
- Commit: o agente escreve a mensagem, citando o CA; o humano roda o
  comando depois de olhar o diff.
- Push: sempre do humano. Com deploy automático, push publica.

## 2. Matriz de aprovação
| ação | nível |
|---|---|
| ler arquivo, rodar build/teste local | livre |
| editar arquivo dentro do escopo da tarefa | livre |
| criar arquivo novo previsto no plano | avisar depois |
| instalar ou atualizar dependência | pedir antes |
| criar migration (mostrar o DDL antes) | pedir antes |
| apagar arquivo ou mover pasta | pedir antes |
| mexer em produção, remoto, deploy ou segredo | proibido (ver restrictions.md) |

## 3. Modelo por fase (para o operador humano)
- Spec e plano: raciocínio alto. Texto curto, decisão cara.
- Executar tarefa já decidida: modelo rápido.
- Debugar: raciocínio alto.
- Revisar: modelo diferente do que escreveu, em sessão limpa.
- Sessão apodreceu ou o agente violou uma regra: gere o handoff e abra
  chat novo.
