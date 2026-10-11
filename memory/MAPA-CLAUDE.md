# MAPA — repo Claude

> Gerado 11-oct-2026 por `~/src/scripts/indices/build_claude_index.py`

**Total:** 1043 arquivos · 20.4 MB · 133,492 linhas · 632,952 tokens indexados · **69 skills**

## Por categoria

| Categoria | Arq | Tokens | O que é |
|---|---:|---:|---|
| `skill_dev` | 328 | 348,145 | Pacote 03 — nativas do Claude (skill-creator, TDD…) |
| `script` | 185 | 114,064 | Scripts que são o corpo de uma skill |
| `skill_workspace` | 55 | 51,876 | Pacote 02 — workspace (docx, pdf, xlsx…) |
| `skill_clinical` | 36 | 41,597 | Pacote 01 — skills médicas (UTI) |
| `skill_backend` | 69 | 25,675 | Pacote 04 — Supabase e Vercel |
| `agent` | 23 | 13,332 | Subagentes — `agents/<nome>/` |
| `skill_ide` | 10 | 12,861 | Pacote 00 — IDE e documentação |
| `other` | 15 | 10,777 | Revisar |
| `docs` | 2 | 5,517 | `docs/` — decisões e runbook |
| `governance` | 8 | 4,685 | `.claude/` — skills, agents, hooks, settings |
| `memory` | 2 | 1,736 | `memory/` — este índice |
| `root` | 4 | 1,489 | CLAUDE.md, README, .gitignore, .env.example |
| `extracao` | 2 | 1,198 | `EXTRACAO-CLINICA-SASI/` — briefing + atalhos |
| `vendor_blob` | 304 | 0 | Binários/pesados (só path, sem FTS) |

## Maiores arquivos (exceto vendor_blob)

- `skills-que-prestam/03-pacote-skills-claude-nativas/skill-creator/SKILL.md` — 10,154 tok (`skill_dev`)
- `skills-que-prestam/03-pacote-skills-claude-nativas/skill-creator/workflows/wrapper-skill/patterns.md` — 6,462 tok (`skill_dev`)
- `skills-que-prestam/03-pacote-skills-claude-nativas/ai-agent-workspace/reference/actors/workflows.md` — 6,322 tok (`skill_dev`)
- `extracao-plantao/extracao-controles-labs-prescricao.html` — 6,255 tok (`other`)
- `skills-que-prestam/03-pacote-skills-claude-nativas/writing-skills/anthropic-best-practices.md` — 5,764 tok (`skill_dev`)
- `skills-que-prestam/03-pacote-skills-claude-nativas/_anthropic/examples/skill-creator/SKILL.md` — 5,205 tok (`skill_dev`)
- `skills-que-prestam/03-pacote-skills-claude-nativas/ai-agent-workspace/BASE_SKILL.md` — 4,821 tok (`skill_dev`)
- `skills-que-prestam/03-pacote-skills-claude-nativas/ai-agent-workspace/reference/actors/lifecycle.md` — 4,719 tok (`skill_dev`)
- `skills-que-prestam/01-pacote-skills-medicas/controles-vitais-janela/references/amostras/prescricao-uti2-2026-06-21.md` — 4,600 tok (`skill_clinical`)
- `skills-que-prestam/03-pacote-skills-claude-nativas/humanizer/SKILL.md` — 4,516 tok (`skill_dev`)
- `skills-que-prestam/02-pacote-skills-workspace/book-to-skill/SKILL.md` — 4,299 tok (`skill_workspace`)
- `skills-que-prestam/00-pacote-ide-e-documentacao/ide-index-mcp/references/tools-reference.md` — 4,295 tok (`skill_ide`)

## Navegação rápida (obrigatório para agentes)

1. **Skills** → `memory/SKILLS-CATALOGO.md` ou `query_claude_index.py skills`
2. **Scripts** → `query_claude_index.py scripts`
3. **Busca** → `query_claude_index.py search <termo>` (FTS5)
4. **Só então** → `Read` no path exato retornado

Não usar `Glob **/skills/**` nem ler `_design/`/`_anthropic/` sem necessidade.

```bash
python3 ~/src/scripts/indices/query_claude_index.py skills --clinical
python3 ~/src/scripts/indices/query_claude_index.py find engine.py
python3 ~/src/scripts/indices/query_claude_index.py agents
```
