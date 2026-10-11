#!/usr/bin/env bash
# modo-de-skills.sh — liga só o grupo de skills do modo atual.
#
# PROBLEMA QUE ISTO RESOLVE
# Cada skill ligada injeta name+description em TODA mensagem. As 41 juntas
# custam 18.636 caracteres (~4.659 tokens) por ida e volta — medido 04-set-2026.
# Skill de plantão cobrada fora do plantão é pedágio puro.
#
# COMO FUNCIONA
# Lê uma palavra de $CLAUDE_CONFIG_DIR/modo e reescreve o bloco "skillOverrides" do
# $CLAUDE_CONFIG_DIR/settings.json: o grupo do modo fica ligado, todo o resto vira
# "off" — a skill some da lista e não é cobrada.
#
# Roda no SessionStart e devolve reloadSkills:true — a troca vale na sessão
# em curso, sem reiniciar o Claude Code.
#
# TROCAR DE MODO:  ~/src/Claude-workspace/.claude/hooks/modo  plantao
set -uo pipefail

MODO_FILE="${CLAUDE_CONFIG_DIR:-$HOME/.claude}/modo"
SETTINGS="${CLAUDE_CONFIG_DIR:-$HOME/.claude}/settings.json"
SKILLS_DIR="${CLAUDE_CONFIG_DIR:-$HOME/.claude}/skills"

# Sem arquivo de modo, o padrão é o mais barato: nada ligado.
MODO="nada"
[ -r "$MODO_FILE" ] && MODO="$(tr -d '[:space:]' < "$MODO_FILE" | tr '[:upper:]' '[:lower:]')"
[ -z "$MODO" ] && MODO="nada"

# Falhar aqui não pode derrubar a sessão: sem jq, sai limpo e não mexe em nada.
if ! command -v jq >/dev/null 2>&1 || [ ! -w "$SETTINGS" ]; then
  printf '{"hookSpecificOutput":{"hookEventName":"SessionStart","additionalContext":"modo-de-skills: inativo (jq ausente ou settings sem escrita)"}}\n'
  exit 0
fi

# Cada modo aponta para os pacotes de skills-que-prestam/ que ele liga.
# O nome do pacote sai do destino real do symlink — sem lista fixa que apodrece.
case "$MODO" in
  plantao)    PACOTES="01-pacote-skills-medicas" ;;
  sasi)       PACOTES="01-pacote-skills-medicas|04-pacote-skills-supabase" ;;
  codigo)     PACOTES="00-pacote-ide|03-pacote-skills-claude-nativas" ;;
  escritorio) PACOTES="02-pacote-skills-workspace" ;;
  estudo)     PACOTES="aula-turbo|book-to-skill|find-docs" ;;
  tudo)       PACOTES="." ;;
  nada|*)     PACOTES="" ;;
esac

ligadas=0; economizadas=0
OVER="{}"
for link in "$SKILLS_DIR"/*/; do
  [ -e "$link" ] || continue
  nome="$(basename "$link")"
  alvo="$(readlink -f "$link" 2>/dev/null || echo "")"

  # As 3 skills locais (add-skill, audit-repository, verify-before-finish) são
  # ferramenta de trabalho, não skill de domínio: ficam SEMPRE ligadas, em
  # qualquer modo e em qualquer diretório. Custo das três, medido 04-set-2026
  # pelo endpoint count_tokens: 383 tokens/msg.
  if [ -z "$alvo" ] || [[ "$alvo" == */.claude/skills/* ]]; then
    ligadas=$((ligadas+1)); continue
  fi

  if [ -n "$PACOTES" ] && echo "$alvo" | grep -qE "$PACOTES"; then
    ligadas=$((ligadas+1))
  else
    OVER="$(printf '%s' "$OVER" | jq --arg n "$nome" '. + {($n): "off"}')"
    economizadas=$((economizadas+1))
  fi
done

# Escrita atômica: monta ao lado e move por cima. Settings meio-escrito
# derruba a sessão inteira — mover é uma operação só, não dá pela metade.
TMP="$(mktemp "${SETTINGS}.XXXXXX")"
if jq --argjson o "$OVER" '.skillOverrides = $o' "$SETTINGS" > "$TMP" 2>/dev/null && [ -s "$TMP" ]; then
  chmod 600 "$TMP"
  mv "$TMP" "$SETTINGS"
else
  rm -f "$TMP"
  printf '{"hookSpecificOutput":{"hookEventName":"SessionStart","additionalContext":"modo-de-skills: settings.json nao pode ser reescrito, nada mudou"}}\n'
  exit 0
fi

jq -n --arg m "$MODO" --argjson l "$ligadas" --argjson e "$economizadas" '
{hookSpecificOutput: {
  hookEventName: "SessionStart",
  reloadSkills: true,
  additionalContext: ("MODO: " + $m + " — " + ($l|tostring) + " skills ligadas, "
    + ($e|tostring) + " desligadas. "
    + "Trocar: .claude/hooks/modo <plantao|sasi|codigo|escritorio|estudo|tudo|nada>")
}}'
