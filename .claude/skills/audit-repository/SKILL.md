---
name: audit-repository
description: Auditoria de integridade deste repo (~/src/Claude-workspace). Aciona quando o operador disser "audita o repo", "confere se está tudo certo aqui", "tem caminho quebrado?", "tem symlink quebrado?", "o índice está velho?", "os números do README ainda valem?", ou antes de fechar uma reestruturação grande. Confere caminho citado em documento contra o disco, symlink de skill, frescor do índice e divergência dos números publicados em README.md e CLAUDE.md.
---

# Auditar o repositório

Objetivo: achar mentira. Documento que cita pasta que não existe, atalho apontando pro vazio, número publicado que envelheceu. Nada aqui conserta — a auditoria **relata**, o conserto é decisão do operador.

Rode tudo a partir da raiz: `cd /home/dr/src/Claude-workspace`.

## 1. Caminho citado × caminho real

Extrai todo caminho entre crases dos documentos e testa um por um. **Crase** = o acento ` que marca trecho de código no Markdown.

```bash
grep -rhoE '`[A-Za-z0-9_.~-]+(/[A-Za-z0-9_.*<>-]+)+/?`' CLAUDE.md README.md docs/*.md agents/README.md context/*.md \
  | tr -d '`' | sort -u \
  | grep -E '^(\.claude|agents|docs|memory|context|scripts|skills-que-prestam|EXTRACAO-CLINICA-SASI|extracao-plantao)/' \
  | grep -vxF -e '.claude/skills/prompt-improver/scripts/engine.py' \
              -e '.claude/rules/repository-navigation.md' \
  | while read -r p; do
      case "$p" in *'<'*|*'*'*) continue;; esac
      [ -e "$p" ] || echo "FALTA: $p"
    done
```

O primeiro `grep -E` só deixa passar caminho que começa numa pasta real deste repo — sem ele entram falsos positivos: endereço de outro repositório (`doutortenente/…`) e caminho de fora (`~/…`). O `case` descarta molde (`<nome>`) e curinga (`*`).

O `grep -vxF` é a **lista de exceções**: duas citações que NÃO existem no disco de propósito, e que sem esta linha fariam a auditoria reprovar para sempre. `-x` exige linha inteira igual, `-F` compara texto literal — nada de curinga.

| Exceção | Por que não existe no disco |
| --- | --- |
| `.claude/skills/prompt-improver/scripts/engine.py` | Citação histórica em `docs/DECISIONS.md`: é o caminho que nunca existiu e que por isso matou os 3 hooks em 22-jul-2026. Apagar a citação apaga a lição. |
| `.claude/rules/repository-navigation.md` | Citação histórica em `docs/DECISIONS.md`: a pasta `.claude/rules/` foi removida em 22-jul-2026 (ver `CLAUDE.md` §2, "Casa única"). |

Com as exceções aplicadas, **saída vazia = aprovado**. Se um caminho novo entrar aqui, ele tem de vir com a justificativa na tabela acima — exceção sem motivo escrito é FALHA disfarçada de OK.

Caminho de fora do repo é conferido à mão, porque só existe um punhado:

```bash
ls -d $CLAUDE_CONFIG_DIR/skills $CLAUDE_CONFIG_DIR/agents $CLAUDE_CONFIG_DIR/settings.json \
      ~/.local/secrets/.env ~/src/scripts/indices/build_claude_index.py
```

## 2. Symlink de skill 1:1

**Symlink** = atalho: o arquivo mora num lugar só e o atalho aponta pra ele.

```bash
find "${CLAUDE_CONFIG_DIR:-$HOME/.claude}/skills" -maxdepth 1 -type l | wc -l   # atalhos ligados
find skills-que-prestam -mindepth 3 -maxdepth 3 -name SKILL.md | wc -l          # skills em pacotes
find .claude/skills -mindepth 2 -maxdepth 2 -name SKILL.md | wc -l              # skills locais
find "${CLAUDE_CONFIG_DIR:-$HOME/.claude}/skills" -maxdepth 1 -xtype l          # atalhos QUEBRADOS
```

Atalhos ligados têm de ser iguais a pacotes + locais (44 em 11-out-2026; a ligação ainda não foi feita, então o esperado hoje é 0 atalhos — registre como achado MÉDIO, não como erro de documento). O terceiro comando tem de imprimir nada — `-xtype l` lista exatamente o atalho cujo destino sumiu. Pasta com prefixo `_` (ex.: `_anthropic`) não é skill e não entra na conta.

## 3. Índice velho

```bash
find . -name '*.md' -newer memory/claude_index.db \
  -not -path './.git/*' -not -path './ide/*' -not -path './memory/*' | head
```

Imprimiu arquivo = o índice é mais antigo que o conteúdo. Regerar com `python3 ~/src/scripts/indices/build_claude_index.py`.

`memory/` fica **fora** desta conta de propósito: o gerador grava o `.db` primeiro e só depois escreve `MAPA-CLAUDE.md` e `SKILLS-CATALOGO.md`. Os dois nascem sempre mais novos que o banco, então sem o `-not -path './memory/*'` esta conferência reprovaria mesmo logo após regerar.

## 4. Número publicado × número real

```bash
git ls-files | wc -l                                    # arquivos versionados
du -sh --exclude=.git . ; du -sh .                      # disco sem / com histórico
find agents -mindepth 1 -maxdepth 1 -type d | wc -l     # subagentes + a pasta docs/
find .claude/agents -name '*.md' | wc -l                # subagentes locais
```

Compare com a seção "Números medidos" do `README.md` e com o §1 do `CLAUDE.md`. Em `agents/`, subtraia 1 da contagem: `agents/docs/` é doutrina, não subagente.

## 5. Find/replace em massa que vazou para skill de terceiro

Já aconteceu **duas vezes**. Renomear uma pasta com busca-e-troca global atinge a palavra comum dentro da
documentação vendorizada, e o estrago fica invisível: o arquivo continua válido, só passa a mentir.

- `fdcb2f2` — trocou `skills` por `pacotao-macaroca-de-skills` dentro de texto corrido.
- 09-ago-2026 — trocou a palavra inglesa `memory` por `mapa-claude-e-catalogo-skills` em 7 linhas de 5 arquivos:
  "Out of **memory** errors" virou "Out of **mapa-claude-e-catalogo-skills** errors".

Nome de pasta deste repo **não tem** o que fazer dentro de `skills-que-prestam/`, que é conteúdo de terceiro:

```bash
grep -rnE 'mapa-claude-e-catalogo-skills|pacotao-macaroca-de-skills|skills-que-prestam' skills-que-prestam/
```

Saída vazia = aprovado. Qualquer acerto é corrupção: leia a frase inteira e devolva a palavra original.

**Prevenção:** ao renomear pasta, troque só o que é caminho — `grep -rl 'x/' | xargs sed -i 's|x/|y/|g'`, com a
barra dentro do padrão. Nunca a palavra solta.

## 6. Relatório final (obrigatório, nesta forma)

| Item | Esperado | Encontrado | Veredito |
| --- | --- | --- | --- |
| Caminhos citados em docs | todos existem | _n_ faltando | OK / FALHA |
| Symlinks × skills | iguais | _n_ × 44 | OK / FALHA |
| Symlinks quebrados | 0 | _n_ | OK / FALHA |
| Índice | mais novo que os `.md` | velho / em dia | OK / FALHA |
| Números do README e do CLAUDE.md | batem | _quais divergiram_ | OK / FALHA |
| Nome de pasta dentro de skill de terceiro | 0 acertos | _n_ | OK / FALHA |

Uma linha por item, sempre as cinco. Item não verificado é `[SEM_FONTE]`, nunca "OK" por otimismo. Cada FALHA leva o caminho exato do arquivo culpado.
