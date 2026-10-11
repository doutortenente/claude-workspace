# claude

**Repositório** (pasta de trabalho com histórico de tudo que mudou) canônico de configuração do Claude Code, a IA que
roda no terminal: **skills** (procedimentos que ela sabe executar) e **subagentes** (ajudantes especializados), com a
versão travada em cada **commit** — assinar uma versão do trabalho no histórico, igual assinar a evolução no
prontuário.

Não é um aplicativo: sem **build** (montar o programa pra rodar) e sem teste automatizado. É uma biblioteca de arquivos
de texto que o Claude Code lê. Exceções: `scripts/sync-claude-config.py`, os hooks de `.claude/hooks/` e a esteira do
plantão (`.github/workflows/` + `EXTRACAO-CLINICA-SASI/esteira/`).

```text
Claude-workspace/
├── CLAUDE.md                    constituição — regra e doutrina do repo
├── README.md                    este arquivo — porta de entrada
├── docs/                        DECISIONS.md (decisões travadas) + RUNBOOK.md (rotinas passo a passo)
├── agents/                      7 subagentes + docs/ (6) + README/CONTRIBUTING/CHANGELOG
├── skills-que-prestam/          41 skills canônicas em 5 pacotes numerados (00 a 04)
├── context/                     persona, templates de settings e MCP, runbook do runtime
├── memory/                      MAPA-CLAUDE.md + SKILLS-CATALOGO.md (índice de busca)
├── scripts/                     sync-claude-config.py (repo → runtime)
├── EXTRACAO-CLINICA-SASI/       pipeline clínico do SASI (esteira do plantão)
├── extracao-plantao/            README da extração de plantão
├── .github/workflows/           esteira do plantão (GitHub Actions)
├── .claude/                     config LIDA pelo Claude Code: 3 skills locais, 1 subagente, hooks, settings
└── .env.example                 modelo de variável de ambiente, sem segredo
```

## Quero X → vá para Y

| Quero | Vá para |
|---|---|
| Entender a regra e a doutrina do repo | `CLAUDE.md` |
| Executar rotina passo a passo (com o teste de "deu certo") | `docs/RUNBOOK.md` |
| Ver decisão já travada (o que não se rediscute) | `docs/DECISIONS.md` |
| Entender a frota de subagentes | `agents/README.md` |
| Entender o runtime e a sincronização | `context/README.md` e `context/runtime-map.md` |
| Descobrir qual skill existe e o que ela faz | `memory/SKILLS-CATALOGO.md` |

## Números medidos (11-out-2026)

- **1.051 arquivos** versionados, **24 MB** em disco sem histórico (**26 MB** de `.git`)
- **41 skills canônicas** em pacotes (00: 6 · 01: 7 · 02: 9 · 03: 14 · 04: 5) + **3 locais** em `.claude/skills/`
- **8 subagentes**: 7 em `agents/<nome>/` + `auditor-do-repo` em `.claude/agents/`
- **Runtime** (`$CLAUDE_CONFIG_DIR` = `~/.config/claude`): nenhum symlink de skill ou agente ligado hoje
- Custo de contexto das skills: `[SEM_FONTE]` — a última medição (04-set-2026) foi com 41 skills e não foi repetida

## Licença

`skills-que-prestam/03-pacote-skills-claude-nativas/_anthropic/` tem **duas licenças**, uma por subpasta — medido em
11-out-2026, 29 arquivos `LICENSE.txt` no total:

| Subpasta | Licenças | Qual | Redistribuir |
| --- | ---: | --- | --- |
| `examples/` | 22 | Apache 2.0 | permitido |
| `public/` (6 skills) | 6 | `© 2025 Anthropic, PBC. All rights reserved.` | **vedado pela licença** |
| `public/frontend-design` | 1 | Apache 2.0 | permitido |

As 6 restritas são `docx`, `xlsx`, `pdf`, `pptx`, `file-reading` e `pdf-reading`. **Este repositório é público** — o
operador foi avisado em 09-ago-2026 e decidiu mantê-lo assim; a decisão está registrada em `docs/DECISIONS.md`.
