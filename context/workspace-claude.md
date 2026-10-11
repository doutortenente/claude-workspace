# Workspace `~/src/`
<!-- Mapa dos repos da máquina. Conferido no disco em 11-out-2026. -->

Não é repo git. Cada pasta abaixo é um repo independente.

| Pasta | GitHub | Papel |
|---|---|---|
| **claude-workspace** | `doutortenente/claude-workspace` | Este repo: skills, subagentes e contexto do Claude Code |
| **scripts** | `doutortenente/scripts` | Casa única de script de infra: `indices/`, `pc/`, `nuvem/`, `obsidian/`, `sasi/` |
| **sasi** | — (não é git) | Produto clínico SASI, cópia local sem remoto |
| **hermes-workspace** | `doutortenente/hermes-workspace` | Workspace do agente Hermes |
| **tijolao-ai** | `doutortenente/tijolao-ai` | `hermes-stack/` e `n8n/` |

Fora de `~/src/`: `~/vaults/celebro` e `~/vaults/Documentos` (vaults de conhecimento, acesso por arquivo).

**Cofre:** `~/.local/secrets/.env` (permissão 600). Fora do git.

## `scripts/` — casa única

| Gaveta | O que faz | Como chamar |
|---|---|---|
| `indices/` | Reconstrói e consulta os índices de busca | `python3 ~/src/scripts/indices/query_claude_index.py skills` |
| `pc/` | Saúde da máquina: disco, boletim | `python3 ~/src/scripts/pc/saude_pc.py` |
| `nuvem/` | OneDrive: catalogar e arquivar | `python3 ~/src/scripts/nuvem/arquivar.py` |
| `sasi/` | Servidor MCP + auditoria de evento clínico | chamado pelo `.mcp.json`, não na mão |
| `obsidian/` | Testa a ponte com o Obsidian | `bash ~/src/scripts/obsidian/check-obsidian-api.sh` |

## Busca

`Grep`/`Glob`. O hook `prefer-ide-tools.sh` (empurrar busca pro MCP de IDE JetBrains) existe em `.claude/hooks/` mas não está registrado.
