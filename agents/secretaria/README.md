# secretaria — documentação

## O que faz
Mantém `$CLAUDE_CONFIG_DIR/memory/comando.md` (memória persistente do operador) atualizada: registra feito/pendente,
inventário e credenciais, sempre consolidando em vez de duplicar linha. Além disso sincroniza os repositórios
locais (`sasi`, `claude`, `celebro`) com o GitHub — commit, push, pull — em toda execução.

## Quando despachar

| Situação | Por que este agente e não o vizinho |
|---|---|
| Fim de sessão, "atualiza a memória", "anota isso" | É o único agente com mandato sobre `comando.md`; nenhum outro escreve memória do operador |
| "sincroniza os repos", "o que eu fiz" | Faz `git fetch`/`status`/`log` nos 3 repos e decide commit/push/pull; `caco` só roda script pronto, não decide o que commitar |
| Registrar credencial ou recurso novo (MCP, conta) | Grava sem questionar segurança (regra do arquivo); não é papel de `chefe` (que cria script); documentar repositório é outra coisa, não é memória pessoal |
| Decisão de arquitetura ou plano de despacho | NÃO é a secretária — isso é do gerente. Ela só registra o que já aconteceu, não decide o que fazer |

## Ferramentas e por quê

| Ferramenta | Para que serve aqui |
|---|---|
| Read | Ler `comando.md` antes de editar, e ler arquivos/commits para confirmar o que foi feito |
| Edit | Único jeito de alterar `comando.md` — é o propósito central do agente |
| Grep | Buscar entrada existente antes de duplicar (regra "CONSOLIDAR e PODAR") |
| Bash | Rodar `git fetch`, `git status`, `git log`, `git add`, `git commit`, `git push`, `git pull --ff-only`, e o gate do SASI (`npm run typecheck && npm run build`) |
| Glob | Não citado no corpo do agente — herdado do padrão de ferramentas, uso não descrito |

`disallowedTools: Agent` — a secretária não pode despachar subagente. Ela é uma folha da árvore de execução,
nunca um nó que delega (a hierarquia de subagentes tem só 2 níveis: **gerente** (quem coordena) → **agente**).
Sem Write: toda escrita passa por Edit, que exige leitura prévia — trava contra sobrescrever `comando.md` sem
antes ler o estado atual.

## Dependências
- `$CLAUDE_CONFIG_DIR/memory/comando.md` — arquivo-alvo, precisa existir.
- `git` instalado e repos clonados em `~/src/sasi`, `~/src/Claude-workspace`, `~/vaults/celebro` com remote
  `origin` configurado.
- Gate do SASI: `~/src/sasi/frontend` com `npm run typecheck` e `npm run build` funcionando (Node 24 via
  nvm) — só roda antes de pushar o SASI, porque push na main é deploy imediato em produção (Vercel).

## Skills relacionadas
Nenhuma identificada no corpo do agente.

## Contexto que ele precisa receber
O gerente deve dizer se é rodada de MEMÓRIA, de SINCRONIZAÇÃO, ou as duas, e se há fato novo pra registrar
(o que foi feito, quando, onde) em vez de deixar a secretária adivinhar pelo `git log`.

```
Despacho: secretaria
Modo: memória + sincronização
Fato novo: "Corrigido bug X em sasi/frontend/src/lib/exportPDF.ts, commitado localmente, não pushado ainda"
Repos a sincronizar: sasi, claude, celebro
Regra: se o gate do SASI (typecheck+build) falhar, reportar erro e NÃO pushar
```

## Armadilhas conhecidas
- Registrar "feito" sem evidência real (commit, arquivo, output) — o arquivo exige confirmar com
  `git log --oneline -10` e `git status`, não confiar na palavra do despacho.
- Push no SASI sem rodar o gate primeiro: push na main do SASI é deploy imediato em produção
  (`sasi-uti.vercel.app`) — pular o gate pode subir build quebrado.
- Resolver conflito de merge por conta própria ou fazer force-push/rebase — é proibido; o agente deve parar e
  reportar, não tentar consertar.

## Como saber se ele fez um bom trabalho
A saída traz duas tabelas conforme o arquivo prescreve: (1) seção · entrada · ação (nova/atualizada/podada) em
`comando.md`, e quando sincronizar, (2) repo · estado (limpo/commitado/pushado/conflito) · commit. Toda entrada
nova em `comando.md` tem data absoluta e repo/caminho — entrada sem essas duas informações, ou com
"ontem"/"semana passada", é falha.
