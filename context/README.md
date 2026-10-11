# Contexto do operador

> Este diretório versiona o **contexto e a configuração** do Claude Code do Dr. Tenente, que antes vivia só no
> disco local e corria risco de perda. Importado em 30-ago-2026; limpo em 11-out-2026 (memória manual e templates
> do Codex removidos).

## Estrutura

| Arquivo | O que é |
| --- | --- |
| `global-claude-persona.md` | Persona global: regra de tradução, perfil, formato de saída, ambiente |
| `workspace-claude.md` | Mapa dos repos em `~/src/` e dos scripts de infra |
| `runtime-map.md` | Quem usa o quê no PC (Claude Code, Hermes, Obsidian…) |
| `runbook-runtime.md` | Rotinas de runtime: ligar skill, trocar token, resolver sintoma |
| `claude/settings.example.json` | Template do `settings.json` do runtime (sem segredo) |
| `claude/settings.local.example.json` | Template do `settings.local.json` |
| `mcp/*.json` | Templates de servidores MCP |

## Sincronização

O runtime é `$CLAUDE_CONFIG_DIR` (nesta máquina, `~/.config/claude`). O script que o preenche a partir deste diretório:

```bash
python3 ~/src/Claude-workspace/scripts/sync-claude-config.py           # simulação, não grava nada
python3 ~/src/Claude-workspace/scripts/sync-claude-config.py --apply   # grava
```

**Cuidado com o `--apply`:** ele **sobrescreve** `settings.json` do runtime com o template e cria 1 symlink por skill em
`$CLAUDE_CONFIG_DIR/skills/`. Rode a simulação primeiro e compare com o `settings.json` atual.

## Segurança

- Nenhum arquivo neste diretório contém chave, token ou senha.
- A chave real mora em `~/.local/secrets/.env` (permissão 600, fora do git).
