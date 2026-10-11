#!/usr/bin/env bash
# ---------------------------------------------------------------------------
# block-sensitive-files.sh — gancho de bloqueio do repo ~/src/claude-workspace
#
# GANCHO (hook) = programinha que o Claude Code executa sozinho ANTES de uma
# ação, e que pode barrar essa ação. Este roda em PreToolUse (antes do uso da
# ferramenta) e é o guarda de porta DAS FERRAMENTAS Write E Edit — só delas.
# Escrita por outra via NÃO passa por aqui: `Bash(printf ... > .env)` grava o
# segredo sem o gancho ser chamado, e o mesmo vale para NotebookEdit. Para
# essas vias a trava é o .gitignore mais as conferências de
# CLAUDE.md §5 ("Antes de commitar").
#
# CONTRATO TÉCNICO
#   Entrada : JSON pela entrada padrão (stdin), campo .tool_input.file_path
#   BARRAR  : motivo na saída de erro (stderr) + exit code 2
#   LIBERAR : exit code 0, sem imprimir nada
#   Sem file_path legível no JSON: libera (exit 0) — este gancho não é o dono
#   da validação do payload, e travar por JSON estranho pararia o trabalho todo.
#
# O QUE ELE BARRA
#   1. qualquer .env (o molde .env.example é liberado — não tem segredo dentro)
#   2. **/settings.local.json  (rascunho de sessão, está no .gitignore)
#   3. ide/**                  (.lock guarda authToken em texto puro)
#   4. .agentbridge/**         (banco de conversa local, fora do git)
#   5. *.log
#
# Registrado em .claude/settings.json → hooks.PreToolUse, matcher "Write|Edit".
# ---------------------------------------------------------------------------
set -euo pipefail

entrada="$(cat)"

# Extrai o caminho. Caminho preferido: jq (lê JSON de verdade).
# Sem jq na máquina, cai no plano B com grep/sed. O "|| true" existe porque
# grep sem acerto devolve erro, e o "set -e" mataria o gancho com exit 1 —
# exit 1 não é nem barrar (2) nem liberar (0), é comportamento indefinido.
if command -v jq >/dev/null 2>&1; then
  caminho="$(printf '%s' "$entrada" | jq -r '.tool_input.file_path // empty' 2>/dev/null || true)"
else
  caminho="$(printf '%s' "$entrada" \
    | grep -o '"file_path"[[:space:]]*:[[:space:]]*"[^"]*"' \
    | head -n1 \
    | sed 's/.*"file_path"[[:space:]]*:[[:space:]]*"//; s/"$//' || true)"
fi

# Sem caminho para julgar, não há o que barrar.
[ -n "$caminho" ] || exit 0

nome="${caminho##*/}"

barra() {
  printf '%s\n' "BLOQUEADO pelo gancho .claude/hooks/block-sensitive-files.sh" >&2
  printf '%s\n' "Motivo : $1" >&2
  printf '%s\n' "Caminho: $caminho" >&2
  exit 2
}

# 1. Cofre de segredo. O molde .env.example passa: só tem nome de variável.
case "$nome" in
  .env.example) : ;;
  .env|.env.*)  barra "arquivo .env guarda segredo. O cofre real é ~/.local/secrets/.env (permissão 600), fora deste repo" ;;
esac

# 2. Rascunho de sessão e log.
case "$nome" in
  settings.local.json) barra "settings.local.json é rascunho de sessão, bloqueado no .gitignore" ;;
  *.log)               barra "arquivo de log não é versionado neste repo" ;;
esac

# 3. Pastas que carregam credencial ou estado local.
case "$caminho" in
  ide/*|*/ide/*)                 barra "ide/ guarda .lock com authToken em texto puro — fora do git E fora do indexador" ;;
  .agentbridge/*|*/.agentbridge/*) barra ".agentbridge/ é banco de conversa local, fora do git" ;;
esac

exit 0
