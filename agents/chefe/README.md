# chefe — documentação

## O que faz
Engenheiro-chefe do arsenal de scripts do Tijolão (`~/src/scripts/`). Decide qual script resolve um problema de infra, projeta e escreve/altera scripts, e revisa o resultado de execuções feitas pelo **caco**. Não executa rotina em produção — só teste de fumaça (rodada rápida de verificação) do que acabou de escrever.

## Quando despachar

| Situação | Por que chefe e não o vizinho |
|---|---|
| MCP de IDE caiu, índice desatualizado, disco cheio, catálogo OneDrive quebrado — precisa decidir/criar/alterar script | Ele é quem projeta e escreve infra; **caco** só roda script que já existe, não decide nem edita |
| Revisar a saída de uma execução do caco | Cérebro da dupla (regra do operador 03-jul-2026): caco é braço, chefe é quem valida o relatório |
| Rotina de manutenção JÁ EXISTE e só precisa rodar | Não é para o chefe — despachar direto pro **caco**, mais barato (Haiku) |
| Instalar biblioteca externa para um script | Chefe tem autorização do operador para pedir/instalar; agentes sem essa permissão não decidem isso |

## Ferramentas e por quê

| Ferramenta | Para que serve aqui |
|---|---|
| Read | Ler script existente antes de alterar |
| Grep | Achar quem chama um script antes de mover (evita quebrar `.mcp.json` ou systemd em silêncio) |
| Glob | Localizar arquivo por padrão de nome nas gavetas de `scripts/` |
| Bash | Rodar teste de fumaça (checagem rápida se o script recém-escrito funciona) e comandos de leitura de estado — não rotina operacional |
| Edit | Alterar script existente |
| Write | Criar script novo |

`disallowedTools: Agent` — chefe não pode lançar outro subagente. A hierarquia da frota é de 2 níveis: quem decide despachar o **caco** é o agente principal, não o chefe.

## Dependências
- Pasta `~/src/scripts/` com as 5 gavetas (`indices/`, `pc/`, `nuvem/`, `sasi/`, `obsidian/`) — casa única de todo script de infra.
- `pip install --user --break-system-packages <lib>` para biblioteca externa (autorizado pelo operador, 03-jul-2026).
- Scripts cabeados fora de `~/src` que não podem ser movidos sem atualizar quem chama: `.mcp.json` → `scripts/sasi/mcp_sasi_wrapper.sh`.

## Skills relacionadas
Nenhuma identificada no corpo do agente.

## Contexto que ele precisa receber
O agente principal deve informar: o problema de infra concreto (sintoma, não diagnóstico), se é script novo ou alteração de existente, e se há execução operacional pendente (ele termina com `ORDEM PRO CACO: <comando>`, não executa rotina ele mesmo).

Exemplo de despacho bom:
```
Índice do repo sasi está desatualizado há 3 dias e a query_sasi_index.py
não reflete os arquivos novos. Confira se build_sasi_index.py precisa de
ajuste ou se é só rodar de novo. Não rode a rotina — devolva a ordem pro caco.
```

## Armadilhas conhecidas
- Mover script sem checar quem o chama primeiro (`grep -rn <nome> ~/src $CLAUDE_CONFIG_DIR/memory ~/.config/systemd`) — os 2 scripts cabeados fora do workspace quebram em silêncio se movidos sem atualizar a referência externa.
- Rodar `rm -rf` sem listagem COMPLETA do alvo antes — já causou perda irrecuperável em 30-jun-2026.
- Esquecer de lembrar o agente principal de registrar script novo/alterado no `comando.md`.

## Como saber se ele fez um bom trabalho
- Resposta traz caminho do script, teste de fumaça com evidência (1-3 linhas de saída real, não afirmação vaga) e, se houver rotina, a linha `ORDEM PRO CACO: <comando exato>`.
- Script novo/alterado segue o padrão da casa: dry-run por default com `--apply` para executar, sem gerar `.bak` (ordem SEM BACKUP de 10-jul-2026), docstring no topo, saída em português.
- Ao revisar relatório do caco: veredito em 1 frase objetiva (ok / falhou por X / rodar de novo com Y), não narrativa.
