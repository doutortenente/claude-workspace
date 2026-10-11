# Runtime Map — quem usa o quê no PC

> **Runtime** = arquivos no disco do PC que as ferramentas leem em **tempo de execução** — não são versionados no
> repo. Fonte canônica do repo: `~/src/Claude-workspace/context/`. Conferido em 11-out-2026.

## Ferramentas e suas pastas

| Ferramenta | Config (runtime) | Origem (repo) |
|---|---|---|
| **Claude Code (CLI)** | `$CLAUDE_CONFIG_DIR/settings.json` (`~/.config/claude`) | `context/claude/settings.example.json` |
| **Claude Code (desktop)** | `~/.claude.json` | — (config do app) |
| **Hermes** | `~/.hermes/` | `~/src/hermes-workspace` (repo próprio) |
| **nvm / node** | `~/.local/share/nvm`, carregado pelo `~/.bashrc` | — |
| **Variáveis do usuário** | `~/.config/shell/env.sh` (lido por `~/.profile` e `~/.bashrc`) | — |

## Fluxo de sincronização (repo → runtime)

```
context/ (versionado) → scripts/sync-claude-config.py --apply → $CLAUDE_CONFIG_DIR (runtime)
```

1. `global-claude-persona.md` → `$CLAUDE_CONFIG_DIR/CLAUDE.md`
2. `claude/settings.example.json` → `$CLAUDE_CONFIG_DIR/settings.json` (**sobrescreve**; preserva `ANTHROPIC_AUTH_TOKEN` se já houver)
3. Cria symlinks em `$CLAUDE_CONFIG_DIR/skills/` → `skills-que-prestam/` + `.claude/skills/`
4. Verifica que os hooks referenciados existem

## Segredos

`~/.local/secrets/.env` (permissão 600, fora do git). Nenhum segredo mora no repo ou em `context/`.

## O que NÃO está no repo

- `~/.hermes/` (bases SQLite, não versionáveis)
- `$CLAUDE_CONFIG_DIR/.credentials.json` (credencial OAuth)
- `$CLAUDE_CONFIG_DIR/skills/synced/` (gerido pelo app)

## Verificação rápida

```bash
# 1. Symlinks de skill quebrados? (vazio = saudável)
find "$CLAUDE_CONFIG_DIR/skills/" -maxdepth 1 -xtype l

# 2. Persona sincronizada? (sem saída = igual; erro = ainda não sincronizado)
diff "$CLAUDE_CONFIG_DIR/CLAUDE.md" ~/src/Claude-workspace/context/global-claude-persona.md

# 3. Nenhum valor de chave no repo? (só aparece nome de variável)
grep -rnE 'sk-[A-Za-z0-9]{16,}' ~/src/Claude-workspace/context/
```
