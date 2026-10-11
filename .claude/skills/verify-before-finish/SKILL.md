---
name: verify-before-finish
description: Conferência adversarial antes de declarar uma entrega concluída neste repo (~/src/Claude-workspace). Aciona SEMPRE antes de dizer "pronto", "concluído", "está funcionando", antes de commitar ou de emitir o bloco CONDUTA FINAL — e quando o operador disser "confere", "prova", "isso rodou mesmo?", "tem certeza?", "não confio, testa". Exige EXECUTAR a verificação (caminho existe, número foi medido, hook roda, índice regerado, doc corrigida), não achar que está certo.
---

# Conferir antes de dizer que acabou

Regra única: **"eu acho que está certo" não é resposta.** Cada item abaixo tem um comando. Sem a saída do comando colada no raciocínio, o item é `[SEM_FONTE]` e a entrega **não** está pronta.

Isto é o checklist de alta do paciente, não o resumo de plantão: confere-se o que foi feito, não o que se pretendia fazer.

## 1. Todo caminho que você citou existe?

Para cada arquivo/pasta que você mencionou na resposta:

```bash
ls -d <caminho>          # ou:  ls -l <caminho>  se for symlink
```

Citou caminho que não conferiu = alucinação. Escrever caminho **futuro** — o que vai existir depois de uma mudança planejada — como se já estivesse no disco é o erro mais caro deste repo: ele já custou duas rodadas de conserto. Plano não é fato. Só existe o que o `ls` acha agora.

## 2. Todo número foi medido?

Nada de "bem menor", "cerca de", "umas 30". Cada número sai de um comando:

```bash
git ls-files | wc -l
find skills-que-prestam -mindepth 3 -maxdepth 3 -name SKILL.md | wc -l
ls -1 $CLAUDE_CONFIG_DIR/skills | wc -l
```

Número herdado do `README.md` ou do `CLAUDE.md` §1 só vale se a medição de lá ainda estiver de pé. Mudou o repo nesta sessão? Remede.

## 3. O que você criou realmente roda?

- **Hook** (gatilho automático que o Claude Code dispara sozinho): confira que o arquivo apontado existe e é executável — `ls -l <caminho-do-script>`. Hook apontando pro vazio cobre token em todo prompt e nunca executa; foi exatamente o que matou três hooks em 22-jul-2026.
- **Script**: execute-o de verdade e mostre o `exit code` (código de saída; `0` = deu certo) com `echo $?`.
- **Skill nova**: reinicie a sessão e confirme que aparece na lista com a `description` escrita.
- **Symlink** (atalho de arquivo — apontador; faz a pasta parecer existir em dois lugares sem duplicar nada): `find $CLAUDE_CONFIG_DIR/skills/ -maxdepth 1 -xtype l` tem de imprimir nada.

## 4. O índice foi regerado?

```bash
find /home/dr/src/Claude-workspace -name '*.md' -newer /home/dr/src/Claude-workspace/memory/claude_index.db \
  -not -path '*/.git/*' -not -path '*/ide/*' | head
```

Imprimiu arquivo = índice velho. Rode `python3 ~/src/scripts/indices/build_claude_index.py`.

## 5. A documentação que você desatualizou foi corrigida?

Mexeu em skill, agente ou estrutura? Então `README.md`, `CLAUDE.md` §1, `memory/SKILLS-CATALOGO.md` e `memory/MAPA-CLAUDE.md` provavelmente mentem agora. Confira e corrija. Doc desatualizada é pior que doc ausente: ela é obedecida.

## 6. Sobrou lixo?

```bash
cd /home/dr/src/Claude-workspace && git status --short
```

Arquivo meio-criado, pasta vazia, `.bak` (proibido — não se faz backup local aqui). O que entrou nesta sessão está ligado e provado, ou sai nela.

## Veredito

Só depois dos seis itens verificados **com saída de comando** você pode fechar. Item que falhou e você não vai consertar agora vira pendência declarada em voz alta — nunca silêncio.
