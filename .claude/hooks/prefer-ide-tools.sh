#!/usr/bin/env bash
# prefer-ide-tools.sh — enquanto a IDE JetBrains estiver viva com este projeto
# aberto, empurra a busca e a troca em massa para as ferramentas do MCP
# `jetbrains-index`, em vez de grep/glob/sed na mão.
#
# HOOK = gatilho automático: um programa que o Claude Code chama sozinho antes
# de usar uma ferramenta, e que pode barrar essa ação.
#
# Dois eventos, um arquivo só:
#   SessionStart -> injeta a tabela de roteamento no começo da sessão (só quando
#                   a IDE está viva; sessão sem IDE não paga esse contexto).
#   PreToolUse   -> intercepta Grep, Glob e Bash. Barra UMA vez por sessão e por
#                   classe, com o nome exato da ferramenta da IDE que resolve.
#
# POR QUE BARRAR SÓ UMA VEZ: existe caso legítimo — índice em `dumbMode` (a IDE
# ainda está montando o catálogo), arquivo fora do projeto, log, binário. Barrar
# sempre viraria parede; barrar uma vez força ler a alternativa e deixa a
# segunda tentativa passar. Hook que vira pedágio é removido (docs/DECISIONS.md).
#
# FALHA ABERTA, SEMPRE. Qualquer erro interno (sem jq, lock ilegível, JSON
# estranho) termina em exit 0. Um hook de roteamento nunca pode travar o
# trabalho.
#
# LIMITES CONHECIDOS, para não prometer o que não entrega:
#   - Só vê as ferramentas Grep, Glob e Bash. `Read`, `Edit` e `Write` passam
#     direto — para esses o que vale é chamar `ide_sync_files` depois.
#   - Subagente (batedor, Explore) não tem o MCP da IDE na caixa de ferramentas.
#     Ele perde no máximo uma chamada por classe e segue.
#   - Desligar na marra: exportar IDE_HOOK=off.
#
# Contrato do PreToolUse: exit 2 + mensagem no stderr = barra e o texto vai para
# o Claude. exit 0 = libera.

[ "${IDE_HOOK:-on}" = "off" ] && exit 0
command -v jq >/dev/null 2>&1 || exit 0

entrada=$(cat 2>/dev/null) || exit 0
[ -n "$entrada" ] || exit 0

evento=$(printf '%s' "$entrada" | jq -r '.hook_event_name // empty' 2>/dev/null)
sid=$(printf '%s' "$entrada" | jq -r '.session_id // "sem-sessao"' 2>/dev/null)
projeto=$(printf '%s' "$entrada" | jq -r '.cwd // empty' 2>/dev/null)
[ -n "$projeto" ] || projeto=$PWD

# Onde o plugin da IDE registra as sessões vivas. Cada `<porta>.lock` é um JSON
# de uma linha com `pid` e `workspaceFolders`. Os dois diretórios são varridos
# porque a casa do lock já mudou de lugar uma vez.
raiz_repo=$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." 2>/dev/null && pwd) || exit 0

# Segunda trava (04-set-2026): o MCP `jetbrains-index` pode estar em
# `disabledMcpServers`. IDE aberta com o MCP desligado significa que as
# ferramentas citadas abaixo não existem na sessão — barrar o Grep deixaria o
# agente sem saída nenhuma.
mcp_ligado() {
  local cfg="${CLAUDE_CONFIG_DIR:-$HOME/.claude}/settings.json"
  [ -f "$cfg" ] || return 0
  jq -e '(.disabledMcpServers // []) | index("jetbrains-index")' "$cfg" >/dev/null 2>&1 && return 1
  return 0
}

mcp_ligado || exit 0

# Lê SÓ pid e workspaceFolders. O lock também carrega `authToken` em texto puro:
# nada aqui pode imprimir o arquivo inteiro, nem em mensagem de erro.
ide_viva() {
  local f pid w
  for f in "${CLAUDE_CONFIG_DIR:-$HOME/.claude}"/ide/*.lock "$raiz_repo"/ide/*.lock; do
    [ -f "$f" ] || continue
    pid=$(jq -r '.pid // empty' "$f" 2>/dev/null)
    [ -n "$pid" ] || continue
    kill -0 "$pid" 2>/dev/null || continue
    while IFS= read -r w; do
      [ -n "$w" ] || continue
      case "$projeto" in "$w" | "$w"/*) return 0 ;; esac
    done < <(jq -r '.workspaceFolders[]? // empty' "$f" 2>/dev/null)
  done
  return 1
}

ide_viva || exit 0

# ---------------------------------------------------------------- SessionStart
if [ "$evento" = "SessionStart" ]; then
  jq -n --arg c 'A IDE JetBrains está viva com este projeto aberto, então o MCP `jetbrains-index` está no ar. Buscar com grep aqui é escolher ver letra em vez de estrutura. Roteamento obrigatório: onde mora o arquivo -> `ide_find_file` (não Glob) · texto no código -> `ide_search_text` (não Grep) · quem usa este símbolo -> `ide_find_references` · onde ele nasce -> `ide_find_definition` · renomear símbolo -> `ide_refactor_rename` (nunca `sed -i` em massa: já corrompeu este repo duas vezes) · mover arquivo -> `ide_move_file`. Antes da primeira busca, `ide_index_status`: com `isDumbMode: true` o catálogo ainda está sendo montado e a resposta vem incompleta, mentindo por omissão — espere e repita, não caia para o grep. Depois de gravar arquivo por Write/Edit, `ide_sync_files` antes de buscar de novo.' \
    '{hookSpecificOutput: {hookEventName: "SessionStart", additionalContext: $c}}'
  exit 0
fi

[ "$evento" = "PreToolUse" ] || exit 0

ferramenta=$(printf '%s' "$entrada" | jq -r '.tool_name // empty' 2>/dev/null)

# Barra uma vez por sessão e por classe. A marca é criada ANTES de barrar, então
# a repetição da mesma chamada passa.
ja_avisou() {
  local dir="${XDG_RUNTIME_DIR:-/tmp}/claude-ide-hook"
  mkdir -p "$dir" 2>/dev/null || return 1
  local marca="$dir/${sid}-$1"
  [ -e "$marca" ] && return 0
  : >"$marca" 2>/dev/null
  return 1
}

case "$ferramenta" in
Glob)
  ja_avisou glob && exit 0
  cat >&2 <<'FIM'
IDE viva: use `mcp__jetbrains-index__ide_find_file` no lugar do Glob.

O Glob casa nome de arquivo por padrão de texto. O `ide_find_file` responde pelo
índice da IDE, que já sabe o que é arquivo do projeto e o que é ruído.

Se for arquivo FORA do projeto, ou a IDE estiver em `isDumbMode: true`, repita
esta mesma chamada — a segunda passa.
FIM
  exit 2
  ;;
Grep)
  ja_avisou grep && exit 0
  cat >&2 <<'FIM'
IDE viva: use o MCP `jetbrains-index` no lugar do Grep.

| Você quer saber                | Ferramenta            |
| ------------------------------ | --------------------- |
| onde este texto aparece        | `ide_search_text`     |
| quem usa este símbolo          | `ide_find_references` |
| onde este símbolo nasce        | `ide_find_definition` |
| quem implementa esta interface | `ide_find_implementations` |

O grep vê letra; o índice entende estrutura. `ide_find_references` responde o
que o grep nem sabe perguntar: quem quebra se eu apagar isto?

Rode `ide_index_status` antes. Com `isDumbMode: true` o catálogo ainda está
sendo montado e a resposta vem incompleta — espere e repita, não caia pro grep.

Busca em log, binário, saída de comando ou arquivo fora do projeto é caso
legítimo: repita esta mesma chamada que a segunda passa.
FIM
  exit 2
  ;;
Bash)
  comando=$(printf '%s' "$entrada" | jq -r '.tool_input.command // empty' 2>/dev/null)
  case "$comando" in
  *"sed -i"* | *"sed --in-place"* | *"perl -pi"* | *"perl -i "*) ;;
  *) exit 0 ;;
  esac
  # Troca num arquivo só é rotina. O que já quebrou este repo é a troca em massa.
  printf '%s' "$comando" | grep -qE 'xargs|grep -rl|find |\*' || exit 0
  ja_avisou sed-massa && exit 0
  cat >&2 <<'FIM'
Troca em massa com `sed -i`: este repo já foi corrompido assim DUAS vezes.

- `fdcb2f2` trocou `skills` por `pacotao-macaroca-de-skills` dentro de texto corrido.
- 09-ago-2026 trocou a palavra inglesa `memory` por um nome de pasta em 7 linhas
  de 5 skills de terceiro: "Out of memory errors" virou outra coisa. O arquivo
  continuou válido — só passou a mentir, que é o estrago que passa batido.

Com a IDE viva existe caminho melhor:
- renomear símbolo (classe, função, variável) -> `ide_refactor_rename`
- trocar texto num arquivo -> `ide_replace_text_in_file`
- padrão estrutural -> `ide_structural_search_replace`
- mover arquivo -> `ide_move_file`

Se `sed` for mesmo o certo, troque só o que é CAMINHO, com a barra dentro do
padrão (`s|antigo/|novo/|g`), nunca a palavra solta — e repita esta chamada,
que a segunda passa.
FIM
  exit 2
  ;;
esac

exit 0
