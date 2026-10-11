# Procedimentos passo a passo

Receita de bolo para as 7 operações de rotina deste repo. Cada procedimento tem passos numerados, o comando exato e a
linha **como saber que deu certo** — se essa linha não bater, o procedimento não terminou.

Regra da casa: a doutrina (*o porquê*) mora em `../CLAUDE.md`. Aqui só tem o *como*.

| # | Procedimento | Quando |
| --- | --- | --- |
| 1 | [Adicionar uma skill nova ao serviço](#1-adicionar-uma-skill-nova-ao-serviço) | skill pronta precisa entrar em operação |
| 2 | [Desligar uma skill que virou pedágio](#2-desligar-uma-skill-que-virou-pedágio) | skill nunca é acionada e custa contexto |
| 3 | [Adicionar um subagente novo](#3-adicionar-um-subagente-novo) | tarefa braçal repetida sem dono na frota |
| 4 | [Regerar o índice](#4-regerar-o-índice-depois-de-mudar-skill-ou-agente) | depois de mexer em skill ou agente |
| 5 | [Entregar um trabalho: do commit ao push](#5-entregar-um-trabalho-do-commit-ao-push) | fim de qualquer trabalho |
| 6 | [Auditar o repo](#6-auditar-o-repo) | antes de fechar reestruturação grande |
| 7 | [Consertar atalho quebrado](#7-consertar-atalho-symlink-quebrado-em-claudeskills) | skill sumiu da lista |

---

## 1. Adicionar uma skill nova ao serviço

Uma **skill** é uma pasta com um arquivo `SKILL.md` dentro — uma receita escrita que o Claude lê e passa a saber
executar. Colocar "em serviço" é fazer o Claude enxergá-la em toda sessão.

O caminho curto: peça ao Claude *"adiciona essa skill"* e a skill `add-skill`
(`../.claude/skills/add-skill/SKILL.md`) executa tudo isto sozinha. Abaixo, o mesmo procedimento na mão.

1. **Escolher o pacote.** As skills ativas moram em `skills-que-prestam/<pacote>/<nome>/`. São 5 gavetas temáticas:

   ```bash
   ls ~/src/claude-workspace/skills-que-prestam/
   ```

   `00-pacote-ide-e-documentacao` · `01-pacote-skills-medicas` · `02-pacote-skills-workspace` ·
   `03-pacote-skills-claude-nativas` · `04-pacote-skills-supabase-e-vercel`.

2. **Criar a pasta e escrever o `SKILL.md`.** O **frontmatter** (cabeçalho entre `---`, como o cabeçalho de um
   prontuário: identifica a peça antes do conteúdo) precisa de `name` e `description`. A `description` é o que dispara a
   skill — escreva *quando* usar, com as palavras que o operador usaria de verdade.

   ```bash
   mkdir -p ~/src/claude-workspace/skills-que-prestam/01-pacote-skills-medicas/<nome-da-skill>
   ```

   ```markdown
   ---
   name: <nome-da-skill>
   description: Use quando <gatilho em português, com as palavras reais do operador>. Não use para <o que NÃO é dela>.
   ---

   # <Título>

   ...corpo em Markdown...
   ```

3. **Ligar o atalho.** Um **symlink** é um atalho de arquivo — uma placa que diz "o conteúdo real está lá". O Claude só
   lê skills de `$CLAUDE_CONFIG_DIR/skills/`, então a pasta do repo precisa de uma placa lá dentro. Use caminho absoluto:

   ```bash
   ln -s ~/src/claude-workspace/skills-que-prestam/01-pacote-skills-medicas/<nome-da-skill> \
         $CLAUDE_CONFIG_DIR/skills/<nome-da-skill>
   ```

4. **Provar que carregou.** Abra uma sessão nova do Claude Code e rode `/skills` — a skill tem que aparecer na lista
   pelo nome.

5. **Regerar o índice** (procedimento 4) e **commitar e dar push** (procedimento 5).

**Como saber que deu certo:** `ls -l $CLAUDE_CONFIG_DIR/skills/<nome-da-skill>` mostra a seta apontando para a pasta no repo,
`/skills` lista a skill numa sessão nova, e a contagem de atalhos bate com a de skills:

```bash
ls $CLAUDE_CONFIG_DIR/skills | wc -l
find ~/src/claude-workspace/skills-que-prestam -mindepth 3 -maxdepth 3 -name SKILL.md | wc -l
```

Os dois números têm que ser iguais.

---

## 2. Desligar uma skill que virou pedágio

Toda skill instalada injeta `name` + `description` no prompt em **toda** mensagem — 11.173 caracteres hoje, no total.
Skill que nunca é acionada é pedágio pago em cada frase. Desligar é remover o atalho; a pasta **continua no repo**, e
religar é um comando.

1. **Conferir para onde o atalho aponta antes de apagar** (nunca apague às cegas):

   ```bash
   ls -l $CLAUDE_CONFIG_DIR/skills/<nome-da-skill>
   ```

   A saída tem que mostrar `-> /home/dr/src/claude-workspace/skills-que-prestam/...`. Se mostrar outra coisa, pare.

2. **Remover só o atalho.** Sem barra no final — barra faz o `rm` mirar no conteúdo, não na placa:

   ```bash
   rm $CLAUDE_CONFIG_DIR/skills/<nome-da-skill>
   ```

3. **Confirmar que a pasta original sobreviveu:**

   ```bash
   ls ~/src/claude-workspace/skills-que-prestam/<pacote>/<nome-da-skill>/SKILL.md
   ```

4. **Regerar o índice** (procedimento 4) e atualizar a contagem de skills no `README.md` e no `CLAUDE.md` §1.

5. Commitar e dar push (procedimento 5).

Para religar depois, é o passo 3 do procedimento 1 de novo.

**Como saber que deu certo:** `ls $CLAUDE_CONFIG_DIR/skills | wc -l` caiu em 1, o `SKILL.md` do passo 3 ainda existe, e a skill
sumiu de `/skills` numa sessão nova.

---

## 3. Adicionar um subagente novo

Um **subagente** é um Claude auxiliar com missão estreita e modelo próprio — o barato varre arquivo, o caro decide.
Ele economiza contexto do agente principal. Antes de criar, leia `../agents/README.md`: se um dos 18 já faz o
trabalho, criar outro é bola de neve, não ganho.

1. **Conferir se já existe dono para a tarefa:**

   ```bash
   python3 ~/src/scripts/indices/query_claude_index.py agents
   ```

2. **Ler o molde e as convenções** antes de escrever:

   - `../agents/docs/template-de-agente.md` — o esqueleto
   - `../agents/docs/convencoes.md` — o que é obrigatório
   - `../agents/docs/roteamento.md` — qual agente pega qual tarefa
   - `../agents/CONTRIBUTING.md` — as regras de contribuição

3. **Criar a pasta e os dois arquivos.** O padrão da casa é `agents/<nome>/<nome>.md` + `agents/<nome>/README.md`:

   ```bash
   mkdir -p ~/src/claude-workspace/agents/<nome>
   ```

   O `<nome>.md` começa com frontmatter neste formato (exemplo real, `agents/fiscal/fiscal.md`):

   ```yaml
   ---
   name: <nome>
   description: Use quando <gatilho>. Não use para <o que é de outro agente, citando o nome dele>.
   tools: Read, Grep, Glob, Bash
   disallowedTools: Agent
   model: haiku | sonnet | opus
   permissionMode: bypassPermissions
   ---
   ```

   `disallowedTools: Agent` é obrigatório: subagente não lança subagente — a hierarquia tem 2 níveis, não mais.

4. **Conferir o cabeçalho na mão** (o validador `validar_frota.py` não existe mais): `name` e `description`
   presentes, `model` e `tools` coerentes com `agents/docs/convencoes.md`, e nenhum `README.md` de pasta com
   cabeçalho YAML.

   ```bash
   head -8 agents/<nome>/<nome>.md
   head -3 agents/<nome>/README.md       # não pode começar com ---
   ```

5. **Regerar o índice** (procedimento 4). O atalho `$CLAUDE_CONFIG_DIR/agents` já aponta para `agents/` inteira — agente novo
   não precisa de atalho próprio.

6. Commitar e dar push (procedimento 5), e atualizar a contagem de subagentes no `README.md` e no `CLAUDE.md` §1.

**Como saber que deu certo:** o cabeçalho confere com `agents/docs/convencoes.md`, o agente
aparece em `query_claude_index.py agents`, e numa sessão nova o Claude consegue chamá-lo pelo nome.

---

## 4. Regerar o índice depois de mudar skill ou agente

O **índice** é o catálogo de busca do repo: um banco de dados pequeno (`memory/claude_index.db`) mais dois documentos
legíveis (`memory/MAPA-CLAUDE.md` e `memory/SKILLS-CATALOGO.md`). É o fichário do repo — se estiver velho, toda consulta
mente com cara de verdade.

O índice deste repo **não** se regenera sozinho. Rodar na mão é obrigatório depois de criar, apagar ou renomear skill,
agente ou documento.

1. **Regerar:**

   ```bash
   python3 ~/src/scripts/indices/build_claude_index.py
   ```

2. **Conferir que o catálogo ficou mais novo que o que você mexeu:**

   ```bash
   ls -l --time-style=+%d-%m\ %H:%M ~/src/claude-workspace/memory/
   ```

3. **Consultar para provar que a mudança entrou:**

   ```bash
   python3 ~/src/scripts/indices/query_claude_index.py skill <nome-da-skill>
   python3 ~/src/scripts/indices/query_claude_index.py agents
   ```

O `claude_index.db` **não** vai para o git (é gerado, não escrito). Já `MAPA-CLAUDE.md` e `SKILLS-CATALOGO.md` são
versionados — entram no commit da entrega.

**Como saber que deu certo:** o script termina em exit code 0, a data dos arquivos em `memory/` é de agora, e a
consulta do passo 3 devolve a skill ou o agente que você acabou de mexer.

---

## 5. Entregar um trabalho: do commit ao push

Regras do repo (mensagem de commit, o que nunca entra num commit): `CLAUDE.md` §5 e §6. Commit direto em `main` é
permitido; branch e PR são opcionais — use quando quiser revisar antes de juntar.

1. **Antes de commitar**, rode a conferência adversarial: peça ao Claude *"confere"* e a skill
   `verify-before-finish` (`../.claude/skills/verify-before-finish/SKILL.md`) tenta derrubar cada afirmação da
   entrega.

2. **Executar a sequência:**

   ```bash
   cd ~/src/claude-workspace
   git status --short                     # só o que você espera
   git add <arquivos>                     # seletivo, nunca `git add -A` às cegas
   git diff --cached | grep -inE "sk-|api[_-]?key|secret|Bearer "   # só nome de variável, nunca valor
   git commit -m "tipo(escopo): o que mudou"
   git push
   ```

3. **Confirmar que a `main` local ficou limpa e igual à remota:**

   ```bash
   git status --short && git log --oneline -3
   ```

**Como saber que deu certo:** `git status --short` não imprime nada (nenhuma alteração solta), o commit da entrega
aparece no `git log --oneline -3`, e `git status -sb` mostra a `main` sem `ahead`/`behind`.

---

## 6. Auditar o repo

A auditoria confere quatro coisas que apodrecem em silêncio: caminho citado em documento que não existe mais no disco,
atalho de skill quebrado, índice velho e número publicado que deixou de bater. Nenhum outro agente da frota faz isso.

1. **Disparar a skill.** Diga ao Claude *"audita o repo"* — a skill `audit-repository`
   (`../.claude/skills/audit-repository/SKILL.md`) faz as 5 verificações e devolve o relatório em tabela.

2. **Ler o relatório.** Ele vem sempre com estas 5 linhas, nesta ordem — nenhuma pode faltar:

   | Item | O que significa quando dá FALHA |
   | --- | --- |
   | Caminhos citados em docs | um documento manda o leitor para um arquivo que não existe |
   | Symlinks × skills | há skill sem atalho, ou atalho sem skill |
   | Symlinks quebrados | atalho apontando para o vazio — a skill sumiu da sessão (ver procedimento 7) |
   | Índice | o catálogo é mais velho que os arquivos — toda consulta está mentindo (ver procedimento 4) |
   | Números do inventário | `README.md` ou `CLAUDE.md` §1 publicam contagem que não bate mais com o disco |

   Item que a skill não conseguiu verificar sai como `[SEM_FONTE]` — nunca como "OK". Cada FALHA vem com o caminho
   exato do arquivo culpado.

3. **Corrigir na ordem do relatório**, de cima para baixo. Caminho quebrado em documento é o mais grave: manda pessoa e
   agente para o lugar errado.

4. **Rodar de novo** e só então commitar e dar push (procedimento 5).

**Como saber que deu certo:** as 5 linhas do relatório saem `OK`, sem nenhum `[SEM_FONTE]`, numa execução feita
*depois* das correções.

---

## 7. Consertar atalho (symlink) quebrado em `$CLAUDE_CONFIG_DIR/skills/`

Atalho quebrado é a placa apontando para uma sala que foi demolida: a pasta da skill foi movida, renomeada ou apagada, e
o atalho ficou. O Claude simplesmente não enxerga mais a skill — sem erro, sem aviso.

1. **Detectar.** `-xtype l` lista atalhos cujo destino não existe:

   ```bash
   find $CLAUDE_CONFIG_DIR/skills -maxdepth 1 -xtype l
   ```

   Saída vazia = nenhum quebrado. Hoje o número correto é **0**.

2. **Ver para onde o atalho quebrado aponta** — o destino errado diz o que aconteceu (pasta renomeada? pacote trocado?):

   ```bash
   ls -l $CLAUDE_CONFIG_DIR/skills/<nome-quebrado>
   ```

3. **Achar onde a pasta foi parar de verdade:**

   ```bash
   find ~/src/claude-workspace/skills-que-prestam -maxdepth 2 -type d -name '<nome-quebrado>'
   ```

4. **Refazer o atalho** — apagar a placa velha e pregar a nova, sempre com caminho absoluto:

   ```bash
   rm $CLAUDE_CONFIG_DIR/skills/<nome-quebrado>
   ln -s <caminho-real-do-passo-3> $CLAUDE_CONFIG_DIR/skills/<nome-quebrado>
   ```

   Se o passo 3 não achou nada, a skill não existe mais: então o certo é só o `rm` — o atalho é lixo.

5. **Reconferir os dois números:**

   ```bash
   find $CLAUDE_CONFIG_DIR/skills -maxdepth 1 -xtype l | wc -l   # tem que dar 0
   ls $CLAUDE_CONFIG_DIR/skills | wc -l                          # tem que bater com a contagem de SKILL.md
   ```

**Como saber que deu certo:** o `find` do passo 5 devolve `0`, a contagem de atalhos bate com a de `SKILL.md` das
skills ativas, e a skill volta a aparecer em `/skills` numa sessão nova.

