---
name: add-skill
description: Põe uma skill nova em serviço neste repo (~/src/Claude-workspace). Aciona quando o operador disser "cria uma skill", "adiciona essa skill", "põe essa skill pra rodar", "instala essa skill", "liga a skill X", "vendoriza essa skill", "achei essa skill no GitHub, traz pra cá", ou quando uma skill pronta precisar sair da reserva fria e entrar em operação. Procedimento executável: escolher pacote, criar a pasta, validar o SKILL.md, ligar o symlink, regerar o índice e commitar e dar push.
---

# Colocar uma skill em serviço

Skill de terceiro: confira a licença antes de trazer (`CLAUDE.md` §5) e recuse a que proíbe redistribuição, porque este repo é público. Aqui é só o procedimento.

Antes de qualquer passo, a pergunta que barra 90% dos casos: **ela vai ser usada de verdade?** Cada skill ligada injeta `name` + `description` em **toda** mensagem, para sempre (hoje: 11.173 caracteres). Skill que fica bonita e não roda é pedágio — vai pra reserva fria, não pra `skills-que-prestam/`.

## 1. Escolher o pacote

Cinco pacotes, não se inventa o sexto: `00-pacote-ide-e-documentacao`, `01-pacote-skills-medicas`, `02-pacote-skills-workspace`, `03-pacote-skills-claude-nativas`, `04-pacote-skills-supabase-e-vercel`. Confirme o que já existe antes de criar coisa nova:

```bash
python3 ~/src/scripts/indices/query_claude_index.py skills | grep -i <palavra-chave>
```

Achou skill que já faz isso? Melhore a existente. Duplicar competência é o pecado da bola de neve.

## 2. Criar a pasta e o SKILL.md

```bash
cd /home/dr/src/Claude-workspace
mkdir -p skills-que-prestam/<pacote>/<nome-em-kebab-case>
```

O `SKILL.md` na raiz da pasta é obrigatório e começa com **frontmatter** (cabeçalho entre três traços que o Claude lê antes do corpo):

```yaml
---
name: <igual ao nome da pasta, kebab-case>
description: <QUANDO acionar — é esta linha que faz o Claude escolher a skill.
  Escreva os gatilhos em português que o operador realmente diria.>
---
```

`description` que descreve *o que a skill faz* em vez de *quando usar* não dispara nunca. Cite os gatilhos literais.

Se a skill trouxer `scripts/`, eles ficam **dentro** da pasta dela — é a única exceção à casa única de scripts (`~/src/scripts/`); tirar de lá quebra a skill. Skill de terceiro entra sem `.git/` e sem `node_modules/`.

## 3. Ligar o atalho

**Symlink** = atalho: o conteúdo mora num lugar só (o repo) e o atalho aponta pra ele. Caminho **absoluto**, igual aos 36 já existentes:

```bash
ln -s /home/dr/src/Claude-workspace/skills-que-prestam/<pacote>/<nome> $CLAUDE_CONFIG_DIR/skills/<nome>
ls -l $CLAUDE_CONFIG_DIR/skills/<nome>          # tem de mostrar o destino, não "No such file"
```

Desligar uma skill = apagar **só o atalho** (`rm $CLAUDE_CONFIG_DIR/skills/<nome>`). A pasta continua no repo.

## 4. Provar que carregou

Reinicie a sessão do Claude Code e confirme que a skill aparece na lista de skills disponíveis, com a `description` que você escreveu. Não apareceu = o `name` do frontmatter diverge do nome da pasta, ou o YAML está malformado.

## 5. Regerar índice, atualizar número, fechar

```bash
python3 ~/src/scripts/indices/build_claude_index.py
```

Atualize a contagem por pacote e o total no `README.md` ("Números medidos") e no `CLAUDE.md` §1 — número publicado que envelhece vira mentira. Depois: commit e push (commit direto em `main` é permitido — `CLAUDE.md` §6).

Antes de dizer que acabou, rode a skill `verify-before-finish`.
