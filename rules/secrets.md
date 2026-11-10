---
description: Onde cada variável de ambiente vive e qual chave usar
globs: ["**/.env*", "src/**"]
alwaysApply: false
---

# Variáveis de ambiente e chaves
> leitor: agente

## Quando
Ao criar ou usar qualquer variável de ambiente, ao instanciar o client
do banco, ou ao escrever código que lê configuração.

## Procedimento
1. Chave pública (anon): é a única que pode ir para o navegador, e quem
   a usa é o repo front (`VITE_*`). A proteção dela são as políticas de
   acesso (RLS) do banco.
2. Chave de serviço (service_role): ignora todas as políticas. Só neste
   repo, em código de servidor, nunca em variável com prefixo público
   (`VITE_`, `NEXT_PUBLIC_`) nem enviada ao front.
3. Variável nova existe em TRÊS lugares ou em nenhum: `.env` local
   (sua máquina, ignorado pelo git), `.env.example` (versionado, sem
   valor) e o painel da Vercel (preview e production).
4. Ao criar uma variável, diga na resposta em quais dos três lugares
   você já a colocou e o que falta eu fazer à mão.

## Verificação
Nenhum arquivo do repo front menciona `service_role`. `.env.example` tem todas as chaves que o projeto usa, sem
nenhum valor real. `git ls-files | grep '\.env'` só mostra `.env.example`.

## Não faça
- Não escreva valor de chave em resposta, commit, log ou comentário.
- Não crie variável só no `.env` local. Ela quebra o deploy e o erro
  só aparece no build da Vercel.
- Não contorne uma política de acesso trocando de chave. Se a política
  atrapalha, a política está errada: pare e me avise.
- Não grave senha de usuário (nem "senha padrão") em arquivo versionado.
