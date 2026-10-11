# Runbook Runtime — resolver problemas comuns

> Procedimentos passo a passo. Cada item tem comando executável e resultado esperado.

## 1. Claude Code não vê uma skill

**Sintoma:** Skill chamada mas não aparece na lista, ou diz "skill not found".

**Diagnóstico:**
```bash
# A skill existe no repo?
find ~/src/Claude-workspace/skills-que-prestam -name SKILL.md | grep <nome>

# O symlink existe e aponta certo?
ls -la $CLAUDE_CONFIG_DIR/skills/<nome>
readlink -f $CLAUDE_CONFIG_DIR/skills/<nome>
```

**Fix:**
```bash
# Sincroniza tudo (recria symlinks quebrados)
python3 ~/src/Claude-workspace/scripts/sync-claude-config.py --apply

# Ou corrige individualmente
rm $CLAUDE_CONFIG_DIR/skills/<nome>
ln -s ~/src/Claude-workspace/skills-que-prestam/<pacote>/<nome> $CLAUDE_CONFIG_DIR/skills/<nome>
```

## 2. Claude Code "não conecta" — erro de auth

**Sintoma:** Mensagem "invalid token" ou "401" quando tenta usar modelo.

**Diagnóstico:**
```bash
ls -l "$CLAUDE_CONFIG_DIR/.credentials.json"      # deve existir, permissão -rw-------
python3 -c "import json,os; s=json.load(open(os.environ['CLAUDE_CONFIG_DIR']+'/settings.json')); print(list(s.get('env',{})))"
```

**Fix:** dentro do Claude Code, rodar `/login`. Se `settings.json` tiver `env.ANTHROPIC_AUTH_TOKEN` vazio ou
com `${...}`, corrigir com `jq` + `mktemp` + `mv` (nunca `sed -i` nem redirecionar direto pro original — se o
comando falhar o arquivo fica vazio e a sessão cai).

## 3. MCP server não responde

**Sintoma:** Claude Code diz "MCP server não respondeu" ou "connection refused".

**Diagnóstico:** `/mcp` dentro do Claude Code lista cada servidor e o estado.

**Fix por server:**
| Server | Como resolver |
|---|---|
| `obsidian` | Reinicia o Obsidian → porta 27123 volta. Se não, reinicia o bridge MCP |
| `supabase` | No menu `/mcp` → Supabase → "Clear authentication" → autenticar de novo |
| `playwright` | `npx @playwright/mcp@latest --help` para testar. Pode precisar `npx playwright install` |
| `agentbridge` | DESABILITADO (endpoint quebrado). Não tem fix — só reativar quando houver endpoint válido |

## 4. Skill ou agente do repo não aparece depois de editar

**Sintoma:** Editei o `SKILL.md` ou o agente no repo e o Claude Code continua com o velho.

**Fix:** o Claude Code só enxerga o que está em `$CLAUDE_CONFIG_DIR/skills/` e `$CLAUDE_CONFIG_DIR/agents/`
(ou em `.claude/` do projeto aberto). Confira o passo 1 (symlink) e reinicie a sessão.

## 5. CLAUDE.md global não reflete mudança

**Sintoma:** Editei algo no repo Claude mas o Claude Code continua com o velho.

**Fix:**
```bash
python3 ~/src/Claude-workspace/scripts/sync-claude-config.py --apply
# confirma:
diff $CLAUDE_CONFIG_DIR/CLAUDE.md ~/src/Claude-workspace/context/global-claude-persona.md  # deve sair vazio
```

## 6. Hook não roda

**Sintoma:** Hook declarado em settings.json mas não executa.

**Diagnóstico:**
```bash
# O caminho do hook existe e é executável?
H=$(grep -o '"command":[^,}]*' $CLAUDE_CONFIG_DIR/settings.json | sed 's/"command": *"//;s/"$//')
for cmd in $H; do test -x "$cmd" && echo "✓" || echo "✗ $cmd"; done
```

**Fix:** se o hook aponta pra fora do repo (caminho quebrado), refaça o path para `.claude/hooks/` do repo.

## 7. using-superpowers some ou duplica skills

**Sintoma:** Skill do plugin aparece duplicada ou some da lista.

**Fix (NÃO executar sem autorização):**
```bash
# using-superpowers é PLUGIN, não skill do repo — permanece como cópia
# Reinstalar pelo marketplace se sumiu:
# /plugin marketplace add using-superpowers
```

## 8. Recovery completo (máquina nova ou disco perdido)

```bash
# 1. Clona o repo
git clone https://github.com/doutortenente/claude-workspace.git ~/src/Claude-workspace

# 2. Sincroniza tudo
python3 ~/src/Claude-workspace/scripts/sync-claude-config.py --apply
# (simule antes sem --apply: ele sobrescreve o settings.json do runtime)

# 3. Reinstala plugins do marketplace pelo `/plugin` do Claude Code
```
