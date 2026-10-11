# zelador — documentação

## O que faz
Ronda de higiene do **workspace** (área de trabalho no disco, `~/src/`). Roda os boletins de saúde já
existentes, filtra pelo limiar fixo e devolve tabela com o que passou do limiar e a rotina que resolve. Não
conserta nada — só mede e aponta.

## Quando despachar

| Situação | Por que este agente e não o vizinho |
|---|---|
| "como tá o ~/src", boletim de saúde, disco cheio, repo bagunçado sem apontar qual | zelador roda checklist fixo determinístico; `batedor` é para reconhecimento de missão VARIÁVEL, não checklist repetido |
| Fim de sessão longa ou troca de domínio (despacho por evento) | zelador é a ronda periódica de estado da máquina; não é tarefa de investigação pontual |
| Item do boletim já apontado, precisa ser corrigido | NÃO é o zelador — despachar `caco` se o script de conserto já existe, ou `chefe` se precisa criar o script |
| Queixa vaga de lentidão sem saber a causa | zelador mede (disco %, RAM livre, repos sujos) e devolve número; não investiga código nem lógica de negócio |

## Ferramentas e por quê

| Ferramenta | Para que serve aqui |
|---|---|
| `Bash` | Rodar `faxina_dev.py` e `saude_pc.py` e qualquer comando complementar de medição |
| `Read` | Ler saída de arquivo/log quando o comando não imprime tudo em stdout |
| `Glob` | Localizar arquivo por padrão quando um boletim aponta candidato mas não lista todos |

Ausentes de propósito:
- **Write/Edit** — não estão na lista de `tools`. O zelador não pode alterar arquivo nenhum; isso mantém a
separação entre medir e agir (quem mede não corrige na mesma passada).
- **Agent** — bloqueada explicitamente em `disallowedTools: Agent`. O zelador não despacha outro subagente;
achado vira ação só na mão do gerente ou do `caco`/`chefe`.

## Dependências
- `python3 ~/src/scripts/pc/faxina_dev.py` — repos sujos/dessincronizados, worktrees órfãos,
`~/Downloads` envelhecido, lixo comum.
- `python3 ~/src/scripts/pc/saude_pc.py` — disco, RAM, peso morto.
- MCP `jetbrains-index` (ferramentas `ide_find_file`, `ide_search_text`, `ide_find_references`) para
reconhecimento de estrutura dentro de sasi/claude/celebro — nunca Glob/Grep em massa nesses repos.

## Skills relacionadas
Nenhuma identificada no corpo do agente.

## Contexto que ele precisa receber
O gerente só precisa despachar o evento gatilho — o agente já sabe rodar os dois scripts. Vale reforçar o
escopo quando a queixa aponta um repo específico, para o boletim não sair genérico demais.

```
Rode a ronda de higiene do workspace (~/src).
Escopo: geral, sem repo específico apontado.
Critério de aceite: tabela item|medido|limiar|rotina, ou linha única
"tudo dentro do limiar" com disco %, RAM livre, nº repos sujos.
Fecha com o bloco de docs/contrato-de-relatorio.md.
```

## Armadilhas conhecidas
Reimplementar em linguagem natural um check que o script já faz — gera divergência entre duas medidas do
mesmo item (o próprio agente marca isso como erro inaceitável). Modo de falha mais provável: listar item que
não bateu o limiar, virando ruído que faz a próxima ronda ser ignorada.

## Como saber se ele fez um bom trabalho
Toda linha da tabela tem número medido (não adjetivo) e rotina de conserto aponta script que EXISTE em
`~/src/scripts/`. Se nada bateu o limiar, saída é uma linha só com os três números principais (disco %,
RAM livre, repos sujos). Nenhuma ação de escrita foi executada pelo próprio zelador.
