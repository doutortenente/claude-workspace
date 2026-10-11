# `claude` — repositório

## 1. O que é

Fonte canônica da configuração do Claude Code: 44 skills (41 em pacotes + 3 locais), 8 subagentes (7 em `agents/` + 1 em `.claude/agents/`). Números medidos em 11-out-2026.

**Não é** aplicativo. Sem build, sem teste, sem dependência. Quase tudo aqui é lido por um agente; as exceções são `scripts/sync-claude-config.py`, os hooks de `.claude/hooks/` e a esteira do plantão (`.github/workflows/` + `EXTRACAO-CLINICA-SASI/`).

**Defeito nº 1 deste repo:** documento que cita caminho inexistente. Já aconteceu várias vezes. É o que a skill `audit-repository` confere.

## 2. Onde mora cada coisa

| O quê | Onde |
|---|---|
| Repo (este) | `~/src/claude-workspace` — remoto `doutortenente/claude-workspace` (público) |
| Pasta de configuração do Claude Code | `$CLAUDE_CONFIG_DIR` = `~/.config/claude` (definido em `~/.config/shell/env.sh`). `~/.claude/` existe vazio, não é a pasta de configuração |
| Cofre de segredos | `~/.local/secrets/.env` (permissão 600). Fora do git |
| Scripts de infra | `~/src/scripts/` (`indices/`, `pc/`, `nuvem/`, `obsidian/`, `sasi/`). Aqui só existe `scripts/sync-claude-config.py` |
| Skill em serviço | `skills-que-prestam/<pacote>/<nome>/SKILL.md` — 5 pacotes numerados (00 a 04) |
| Skill local do repo | `.claude/skills/<nome>/SKILL.md` — `add-skill`, `audit-repository`, `verify-before-finish` |
| Subagente | `agents/<nome>/<nome>.md` + `README.md`; o `auditor-do-repo` mora em `.claude/agents/` |
| Hook | `.claude/hooks/` — `block-sensitive-files.sh` (registrado em `.claude/settings.json`) e `prefer-ide-tools.sh` (não registrado) |
| Contexto do operador | `context/` — persona, templates de settings e de MCP, runbook da pasta de configuração |
| Índice | `memory/MAPA-CLAUDE.md` + `memory/SKILLS-CATALOGO.md`. Regerar: `python3 ~/src/scripts/indices/build_claude_index.py` |

**Ligação com a pasta de configuração (medido 11-out-2026):** não há symlink de skill nem de agente em `$CLAUDE_CONFIG_DIR`. Hoje a pasta só tem `skills/synced/` (gerido pelo próprio app). As skills deste repo entram em serviço por symlink individual (`ln -s`, ver `.claude/skills/add-skill/SKILL.md`) ou por `scripts/sync-claude-config.py --apply` — este último **sobrescreve** o `settings.json` da pasta de configuração com o template, então simule antes (sem `--apply`).

**Casa única:** config mora onde o Claude Code lê, sem cópia no repo. Cópia num segundo lugar apodrece — foi o que matou `settings/` e `rules/` em 22-jul-2026, e de novo em 04-set-2026.

## 3. Custo de skill

Skill ligada injeta `name` + `description` em toda mensagem. Medição de 04-set-2026 (41 skills, endpoint `count_tokens`): **5.172 tokens por mensagem** somadas. Sem remedição desde a expansão para 44. Por isso: ligar só o que se usa. O sistema de modos que trocava grupos de skills foi removido em 11-out-2026.

## 4. Busca

`Grep`/`Glob`, ou `python3 ~/src/scripts/indices/query_claude_index.py search <termo>` pra catálogo. O hook `prefer-ide-tools.sh` (preferir MCP de IDE JetBrains) existe mas não está registrado.

**Não abrir sem necessidade:** `skills-que-prestam/` inteira com `Glob` · `_anthropic/` sem a skill ter sido acionada.

## 5. Segurança

- Cofre é `~/.local/secrets/.env` (permissão 600). **Nada de chave neste repo** — só `.env.example`. O hook `block-sensitive-files.sh` barra `Write`/`Edit` em `.env` e afins.
- `_anthropic/public/` tem 6 skills sob `© 2025 Anthropic, PBC. All rights reserved.` (`docx`, `xlsx`, `pdf`, `pptx`, `file-reading`, `pdf-reading`); o resto de `_anthropic/` é Apache 2.0. `doutortenente/claude-workspace` é público — risco assumido pelo operador em 09-ago-2026, registrado em `docs/DECISIONS.md`.
- O histórico do git é público. O que foi apagado do disco continua nos commits antigos.
- Credencial do Claude Code: `$CLAUDE_CONFIG_DIR/.credentials.json` (600). `settings.json` da pasta de configuração não guarda token. Editar JSON de config por script exige `mktemp` + `mv` — redirecionar direto pro original deixa o arquivo vazio se o `jq` falhar.

**Antes de commitar:** `git status --short` · `git diff --cached --name-only` · `git diff --cached | grep -inE "sk-|api[_-]?key|secret|Bearer "` (só pode aparecer nome de variável, nunca valor).

## 6. Git

Sem `.bak`, sem `arquivo-v2.md`, sem tarball — o git é o backup.
Mensagem: `tipo(escopo): o que mudou` — `feat`, `fix`, `refactor`, `docs`, `chore`.
Commit direto em `main` é permitido.

## 7. Referências

`README.md` · `docs/DECISIONS.md` · `docs/RUNBOOK.md` · `agents/README.md` · `context/README.md`
