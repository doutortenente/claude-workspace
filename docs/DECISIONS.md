# Decisões arquiteturais

> O **porquê** que não cabe no código. Cada entrada registra uma decisão já tomada, o problema que ela resolveu, o que
> foi jogado fora e como conferir que ainda vale.
> A regra em uma linha está no [`CLAUDE.md`](../CLAUDE.md). Aqui está o motivo.

**Registro, não debate.** Decisão listada aqui não se rediscute sem fato novo medido.

| # | Decisão | Data |
| ---: | --- | --- |
| 1 | Casa única de config | 22-jul-2026 |
| 2 | Casa única de script | 22-jul-2026 |
| 3 | Skills em 5 pacotes temáticos | 01-ago-2026 |
| 4 | Reserva fria fora deste repo | 07-ago-2026 |
| 5 | Subagentes em pasta própria | 07-ago-2026 |
| 6 | Push e merge sem confirmação; commit direto em `main` permitido (revisada 11-out-2026) | 28-jul-2026 |
| 7 | Sem backup local | 10-jul-2026 |
| 8 | Hook que não roda é removido | 22-jul-2026 |
| 9 | Índice em `memory/`, `ide/` fora do indexador | 08-ago-2026 |
| 10 | Só `auditor-do-repo` foi criado | 08-ago-2026 |
| 11 | Renomear pasta e repo CANCELADO; o nome é `claude` | 09-ago-2026 |
| 12 | Regras de PHI removidas da governança | 09-ago-2026 |
| 13 | `_anthropic/` tem duas licenças; repo segue público | 09-ago-2026 |
| 14 | Com a IDE viva, Grep/Glob/`sed -i` em massa são barrados 1× | 09-ago-2026 |
| 15 | Contexto do operador versionado em `context/` + sync script | 30-ago-2026 |
| 16 | Limpeza de 11-out-2026: 11 agentes e 2 docs removidos, runtime em `$CLAUDE_CONFIG_DIR`, repos em `~/src` | 11-out-2026 |

---

### 1. Casa única de config, sem cópia no repo (22-jul-2026)

**Decisão:** **config** (arquivo de ajuste que o programa lê ao ligar, como o protocolo impresso que fica colado na
parede da UTI) mora só onde o Claude Code lê de verdade — nunca duplicada aqui dentro.

**Problema que resolveu:** existiam `settings/` e `rules/` na raiz do repo que ninguém carregava. Eram fotocópia de um
protocolo antigo pendurada numa parede errada: quem lia, lia a versão desatualizada, e quem editava, editava o papel
que o sistema ignorava. Cópia num segundo lugar apodrece.

**O que foi descartado e por quê:** descartado manter cópia "de referência" no repo, e descartado **symlink** (atalho
que aponta para o arquivo verdadeiro) da config para dentro do repo — ordem do operador na mesma data: "symlink caga a
organização". Symlink continua permitido só onde já era, nas skills e nos agentes.

**Como verificar que continua valendo:**
```bash
ls -d ~/projetos/claude/settings ~/projetos/claude/rules 2>&1   # tem que dar "inexistente" nas duas
```

---

### 2. Casa única de script em `~/projetos/scripts/` (22-jul-2026)

**Decisão:** todo **script** de infraestrutura (arquivo de comandos automáticos, o equivalente a uma rotina fixa de
enfermagem) mora em `~/projetos/scripts/`, em gavetas por assunto. Este repo não tem pasta `scripts/`.

**Problema que resolveu:** havia quatro pastas de script espalhadas por repos diferentes. Ninguém sabia qual versão do
mesmo script era a viva, e corrigir um bug obrigava a caçar as quatro.

**O que foi descartado e por quê:** descartado deixar cada repo com sua `scripts/` própria. Uma exceção sobreviveu com
motivo técnico: script que **é o corpo de uma skill** fica em `skills-que-prestam/<pacote>/<nome>/scripts/`, porque a
skill o chama por caminho relativo — tirar de lá quebra a skill em silêncio.

**Como verificar que continua valendo:**
```bash
ls -d ~/projetos/claude/scripts 2>&1        # tem que dar "inexistente"
find ~/projetos/claude/skills-que-prestam -maxdepth 3 -type d -name scripts   # só corpo de skill pode aparecer
```

---

### 3. Skills organizadas em 5 pacotes temáticos numerados (01-ago-2026)

**Decisão:** as 36 skills ativas vivem em `skills-que-prestam/<pacote>/<nome>/`, em cinco pacotes numerados, e cada uma
é ligada individualmente por symlink em `~/.claude/skills/`.

**Problema que resolveu:** as skills estavam achatadas num único nível, sem agrupamento. Achar a skill certa exigia ler
a lista inteira, e não dava para desligar um bloco de assunto sem caçar item por item. O número no prefixo
(`00-`, `01-`…) força a ordem de leitura em vez de deixar o alfabeto decidir.

**O que foi descartado e por quê:** descartado o symlink único apontando para a pasta-mãe. Ligar o pacote inteiro tira
o controle fino — cada skill instalada cobre pedágio de contexto (hoje **11.173 caracteres** injetados em toda
mensagem), então desligar uma precisa custar um comando, não uma reorganização.

**Como verificar que continua valendo:**
```bash
ls ~/.claude/skills/ | wc -l                                   # 36
find ~/.claude/skills/ -xtype l                                # vazio = nenhum symlink quebrado
python3 ~/projetos/scripts/indices/query_claude_index.py skills
```

---

### 4. Reserva fria de 85 skills extraída para outro repo (07-ago-2026)

**Decisão:** as 85 skills de terceiros que não estão em serviço saíram daqui para o repo privado
`doutortenente/pacotao-macaroca-de-skills`, publicado como marketplace de plugin do Claude Code.

**Problema que resolveu:** peso morto. Eram **24 MB / 572 arquivos** ocupando disco e, pior, entrando no índice de
busca — cada consulta ao repo varria material que nunca seria acionado. Estoque de material vencido no almoxarifado
atrapalha achar o que se usa.

**O que foi descartado e por quê:** descartado apagar (perderia a reserva) e descartado manter clonado aqui em pasta
com prefixo `_` (o indexador continuaria pegando). A procedência de cada skill — origem, commit fixado, licença —
mora no `reference/VENDOR.md` daquele repo, não neste. Não reclonar para cá.

**Como verificar que continua valendo:**
```bash
ls -d ~/projetos/claude/pacotao-macaroca-de-skills 2>&1   # tem que dar "inexistente"
git -C ~/projetos/claude ls-files | wc -l                 # 910 na medição de 08-ago-2026
```

---

### 5. Subagentes padronizados em `agents/<nome>/<nome>.md` (07-ago-2026)

**Decisão:** os 18 **subagentes** (assistentes especializados que recebem uma tarefa fechada, como um residente que
você manda buscar um exame) seguem uma forma só: uma pasta por agente, com o arquivo de mesmo nome dentro, mais o
`agents/README.md` que mapeia quem chama quem.

**Problema que resolveu:** os agentes tinham formatos diferentes entre si — uns arquivo solto, outros pasta. Sem forma
fixa, não dava para validar o conjunto por script nem para saber, olhando, se um agente estava completo.

**O que foi descartado e por quê:** descartado o arquivo solto `agents/<nome>.md`. Pasta própria é o que permite ao
agente carregar material anexo (referência, exemplo) sem poluir a raiz. A doutrina comum ficou em `agents/docs/`
(6 arquivos), fora dos agentes, para não ser copiada 18 vezes.

**Como verificar que continua valendo:**
```bash
python3 ~/projetos/scripts/indices/query_claude_index.py agents   # 18
ls ~/projetos/claude/agents/docs | wc -l                          # 6
```

---

### 6. Push e merge sem pedir confirmação; commit direto em `main` permitido (28-jul-2026, revisada em 11-out-2026)

> **Revisão de 11-out-2026:** o operador mandou remover a proibição de commit direto na `main`. Vale agora só a metade
> sobre confirmação: não se pergunta antes de push e merge. Branch e PR ficam opcionais. O texto abaixo é o original.

**Decisão:** ao concluir um trabalho, o fluxo é **branch** (linha de trabalho paralela) → **PR** (pedido de incorporação
revisável) → **merge** (junção na linha principal), e o merge acontece sem parar para perguntar. **Commit** (registro
de uma mudança) direto na `main` continua proibido.

**Problema que resolveu:** o operador estava sendo interrompido por um pedido de autorização em cada fechamento de
tarefa, para responder sempre a mesma coisa. Pergunta cuja resposta é conhecida é imposto de atenção, e ele tem TDAH —
interrupção sem informação nova custa caro.

**O que foi descartado e por quê:** descartado dispensar o PR junto com a confirmação. O PR não existe para pedir
licença: ele existe para deixar rastro auditável do que entrou e permitir desfazer. Só a etapa de aprovação humana
caiu; a trilha ficou.

**Como verificar que continua valendo:** o histórico da `main` não pode ter commit que não tenha vindo de merge de
branch.
```bash
git -C ~/projetos/claude log --oneline -10 main
```

---

### 7. Sem backup local: nada de `.bak` nem tarball (10-jul-2026)

**Decisão:** não criar cópia de segurança local — nem arquivo terminado em `.bak`, nem **tarball** (pacote compactado
de uma pasta inteira).

**Problema que resolveu:** cópia local vira lixo que ninguém limpa e, pior, vira fonte ambígua: dois arquivos parecidos
e nenhuma certeza de qual é o vivo. O SSD tem 111,8 G e o disco é recurso escasso nesta máquina.

**O que foi descartado e por quê:** descartada a rede de segurança caseira porque já existe uma melhor: o histórico do
**git** (registro versionado de toda mudança) no GitHub. Recuperar arquivo apagado é `git checkout`, não escavação de
`.bak`. O preço aceito conscientemente: o que nunca foi commitado não tem volta — daí a regra de listagem completa
antes de apagar pasta.

**Como verificar que continua valendo:**
```bash
find ~/projetos/claude -path ~/projetos/claude/skills-que-prestam -prune -o \
     \( -name "*.bak" -o -name "*.tar.gz" -o -name "*.tgz" \) -print   # tem que sair vazio
```
> `skills-que-prestam/` fica de fora da busca: os dois `.tar.gz` de lá são material que veio junto com a skill
> (`artifacts-builder`, `_anthropic/examples/web-artifacts-builder`), não backup.

---

### 8. Hook que não roda é removido (22-jul-2026)

**Decisão:** **hook** (gatilho automático que dispara antes ou depois de uma ação, como o alarme do monitor que toca
sozinho quando a saturação cai) que não executa sai do sistema. Não fica desativado, não fica comentado — sai.

**Problema que resolveu:** os três hooks do `prompt-improver` apontavam para
`.claude/skills/prompt-improver/scripts/engine.py`, caminho que não existia. Cobravam **~189 tokens por prompt** e
nunca rodaram uma vez. Era um alarme desligado da tomada, ocupando espaço no painel e cobrando manutenção.

**O que foi descartado e por quê:** descartado consertar o caminho. A skill continua no repo e pode ser chamada à mão;
o disparo automático não tinha demanda comprovada que justificasse o pedágio em toda mensagem.

**Como verificar que continua valendo:** todo hook declarado tem que apontar para arquivo que existe e ser executável.
```bash
ls ~/projetos/claude/.claude/hooks/
grep -o '"command":[^,}]*' ~/projetos/claude/.claude/settings.json
```

---

### 9. Índice em `memory/`, categorizador corrigido, `ide/` fora do indexador (08-ago-2026)

**Decisão:** a pasta do índice passou de `mapa-claude-e-catalogo-skills/` para `memory/`, o categorizador do indexador
foi corrigido e a pasta `ide/` ficou fora do indexador — não só fora do git.

**Problema que resolveu:** dois problemas em um. O nome antigo descrevia dois produtos numa frase e não batia com o
padrão dos repos irmãos (`sasi/memory`). E, o grave: os arquivos `ide/*.lock` carregam **authToken** (senha de sessão
para falar com a IDE) em texto puro — estavam bloqueados no git, mas o indexador ainda os lia e os despejava no índice
de busca. Segredo fora do git mas dentro do índice continua sendo segredo vazado.

**O que foi descartado e por quê:** descartado confiar só no `.gitignore` (lista do que o git ignora). Ignorar no git
protege o que sai para o GitHub; não protege o que o indexador local escreve no `MAPA-CLAUDE.md`. As duas barreiras
precisam existir.

**Como verificar que continua valendo:**
```bash
grep -rn "authToken" ~/projetos/claude/memory/MAPA-CLAUDE.md   # tem que sair vazio
grep -n "ide/" ~/projetos/claude/.gitignore                    # linha 25
```

---

### 10. Dos agentes genéricos propostos, só `auditor-do-repo` foi criado (08-ago-2026)

**Decisão:** dos três agentes genéricos propostos — `security-reviewer`, `documentation-reviewer`,
`repository-auditor` — nenhum foi criado. Criou-se apenas `auditor-do-repo`, escopado a este repositório.

**Problema que resolveu:** a proposta duplicaria competência que a frota de 18 já tem: `segurador` cobre segurança,
`documentador` cobre documentação, `fiscal` refuta entrega e `zelador` cuida da higiene. Três agentes a mais seriam
três descrições a mais no prompt e, na hora de acionar, ambiguidade sobre qual chamar. É a "bola de neve": ferramenta
que entra, não é usada e ninguém remove.

**O que foi descartado e por quê:** `auditor-do-repo` sobreviveu ao corte porque faz o que nenhum outro faz — conferir
se caminho citado em documento existe no disco. Documentação que aponta para pasta inexistente é a falha mais comum
deste repo, e detectá-la é trabalho mecânico, não julgamento.

**Como verificar que continua valendo:**
```bash
ls ~/projetos/claude/.claude/agents/          # só auditor-do-repo.md
ls ~/projetos/claude/agents/ | grep -Ec '^(security-reviewer|documentation-reviewer|repository-auditor)$'   # 0
```

---

### 11. Renomear a pasta e o repo foi CANCELADO — o nome continua `claude` (09-ago-2026)

**Decisão:** ordem direta do operador, revogando o que estava planejado em 08-ago-2026. A pasta é e continua
`~/projetos/claude`; o repositório é e continua `doutortenente/Claude`. **Não existe fase 2.**

**Problema que resolveu:** o nome `claude` é o **padrão de fábrica**. O Claude Code procura configuração em
`~/.claude/`; os 36 atalhos de skill, o atalho de agentes, os dois scripts de índice, `~/.claude.json`, os arquivos de
memória do operador e `~/projetos/CLAUDE.md` gravam `/home/dr/projetos/claude` **por extenso**, sem um caminho
relativo sequer. Renomear troca um incômodo de vocabulário por uma superfície de quebra em ~45 pontos — e quebra em
silêncio: a skill some da lista, o índice para de achar arquivo, o script falha ao abrir caminho que não existe mais.
Palavras do operador: *"tudo sempre por padrão geralmente orienta pra claude"*.

**O que foi descartado e por quê:** descartado o plano de mover a pasta e usar `gh repo rename`. O ganho era estético
(desambiguar "o claude" produto de "o claude" configuração) e o custo era estrutural. Ambiguidade de nome se resolve
falando com mais precisão; caminho absoluto quebrado só se resolve caçando os 45 pontos um a um.

**Como verificar que continua valendo:**
```bash
ls -d ~/projetos/claude                                        # existe
ls -d ~/projetos/claude-steroid 2>&1                           # NÃO existe, e não deve passar a existir
git -C ~/projetos/claude remote -v | head -1                   # aponta para doutortenente/Claude
# nenhum documento pode prometer o rename — só esta decisão pode citar o nome descartado
grep -rn 'claude-steroid' ~/projetos/claude/ --include='*.md' --exclude-dir=.git \
  | grep -v 'docs/DECISIONS\.md'                               # tem que sair vazio
```

---

### 12. Regras de PHI removidas da governança deste repo (09-ago-2026)

**Decisão:** ordem direta do operador. Toda regra e restrição sobre **PHI** (dado que identifica paciente) sai da
governança deste repositório. A regra que se chamava `security-and-phi.md` virou
`security-and-secrets.md` (removido junto com `.claude/rules/`) sem a seção de PHI, o gancho parou de barrar
caminho com `PHI` no nome, e a conferência de PHI saiu da lista pré-commit (6 itens viraram 5).

**Problema que resolveu:** o operador quis a governança do repo tratando só de segredo e credencial. Regra clínica que
ele já cumpre por dever profissional não precisa estar duplicada como trava de ferramenta.

**O que foi descartado e por quê:** descartada a trava automática — o gancho não olha mais o nome do caminho atrás de
`PHI`. Fica registrado o que a remoção custou, para quem ler isto daqui a seis meses não achar que foi esquecimento:
era a única barreira automática entre dado de paciente e um commit. O que **permanece** protegido: `.env` e derivados,
`settings.local.json`, `ide/**` (guarda `authToken`), `.agentbridge/**` e `*.log`.

**Como verificar que continua valendo:**
```bash
# este arquivo é a única exceção: ele PRECISA nomear o que foi removido, senão o registro não registra nada
grep -rnw PHI ~/projetos/claude/CLAUDE.md ~/projetos/claude/.claude \
     ~/projetos/claude/docs --exclude=DECISIONS.md    # tem que sair vazio
printf '%s' '{"tool_input":{"file_path":"/x/PHI-LOCAL/n.md"}}' \
  | bash ~/projetos/claude/.claude/hooks/block-sensitive-files.sh; echo "esperado 0, veio $?"
```

---

### 13. `_anthropic/` tem duas licenças, e o repo segue público (09-ago-2026)

**Decisão:** parar de afirmar que `_anthropic/` é proprietário em bloco. Medido: `examples/` traz 23 `LICENSE.txt`
**Apache 2.0** (redistribuir é permitido) e `public/` traz 6 com `© 2025 Anthropic, PBC. All rights reserved.`
(`docx`, `xlsx`, `pdf`, `pptx`, `file-reading`, `pdf-reading`). O repositório `doutortenente/Claude` é **público** e,
avisado disso, o operador decidiu mantê-lo público.

**Problema que resolveu:** a documentação dizia "não redistribuir fora deste repo **privado**" — duas afirmações
erradas na mesma frase. A licença não era única e o repositório não era privado. Quem lesse aquilo tomaria decisão de
distribuição com base em fato falso.

**O que foi descartado e por quê:** descartado tornar o repositório privado e descartado remover `public/` do
rastreamento. Ambos foram propostos ao operador em 09-ago-2026 e recusados por ele; a exposição das 6 skills
`All rights reserved` é **risco assumido**, não descuido. Registrado aqui para não voltar à pauta sem fato novo.

**Como verificar que continua valendo:**
```bash
A=~/projetos/claude/skills-que-prestam/03-pacote-skills-claude-nativas/_anthropic
find $A -name LICENSE.txt -exec grep -li "all rights reserved" {} \; | wc -l   # esperado 6
find $A -name LICENSE.txt -exec grep -li "apache license"      {} \; | wc -l   # esperado 23
gh repo view doutortenente/Claude --json visibility -q .visibility            # esperado PUBLIC
```

---

### 14. Com a IDE viva, buscar na mão é barrado — uma vez por sessão (09-ago-2026)

**Decisão:** o hook `.claude/hooks/prefer-ide-tools.sh`, registrado no `~/.claude/settings.json` **global**, barra
`Grep`, `Glob` e `sed -i` em massa **enquanto houver uma IDE JetBrains viva com o projeto aberto**, devolvendo o nome
exato da ferramenta do MCP `jetbrains-index` que resolve. Barra **uma vez por sessão e por classe**: repetir a mesma
chamada passa.

**Problema que resolveu:** a regra "buscar antes de varrer" existia em `.claude/rules/repository-navigation.md` desde
08-ago-2026 e mesmo assim continuou sendo ignorada — inclusive na sessão que a escreveu. Regra escrita depende de o
agente lembrar; hook não depende. Palavras do operador: *"não ficar igual primata fazendo tudo na mão sendo que a IDE
faz pra você"*. O `sed -i` em massa entrou na mesma trava porque é o caminho pelo qual este repo já foi corrompido
duas vezes (`fdcb2f2` e 09-ago-2026).

**O que foi descartado e por quê:** descartado **barrar sempre**. Existe caso legítimo de sobra — índice em
`isDumbMode` (a IDE ainda montando o catálogo), arquivo fora do projeto, log, binário, e subagente que nem tem o MCP na
caixa de ferramentas. Barreira sem saída viraria pedágio e seria removida na semana seguinte, como os três hooks do
`prompt-improver` em 22-jul-2026. Barrar uma vez força ler a alternativa e custa no máximo uma chamada. Descartado
também estender aos eventos `Write`/`Edit`: fica para o `ide_sync_files` depois da escrita, citado no `SessionStart`.
Descartado registrar no `.claude/settings.json` deste repo — a WebStorm também abre o SASI, e a regra vale lá.

**Como verificar que continua valendo:**
```bash
H=~/projetos/claude/.claude/hooks/prefer-ide-tools.sh; S=chk-$$
J(){ printf '{"session_id":"%s","hook_event_name":"PreToolUse","tool_name":"%s","cwd":"%s","tool_input":%s}' "$S" "$1" "$2" "$3"; }
# com a IDE ABERTA neste projeto: barra na 1ª, libera na 2ª
J Grep ~/projetos/claude '{"pattern":"x"}' | bash $H >/dev/null 2>&1; echo "1a: $? (esperado 2)"
J Grep ~/projetos/claude '{"pattern":"x"}' | bash $H >/dev/null 2>&1; echo "2a: $? (esperado 0)"
# projeto sem IDE aberta nunca é barrado
J Grep ~/vaults/celebro '{"pattern":"x"}'  | bash $H >/dev/null 2>&1; echo "sem IDE: $? (esperado 0)"
```

---

### 15. Contexto do operador versionado em `context/` + sync script (30-ago-2026)

**Decisão:** o contexto do operador — persona global (`CLAUDE.md`), memória (4 arquivos `.md`), configs sanitizadas
de settings/MCP/Codex — passa a ser **versionado** em `context/` dentro deste repo, e é **empurrado** para `~/.claude/`
pelo script `scripts/sync-claude-config.py`.

**Problema que resolveu:** o operador perdia horas de contexto (comando, débitos, log, alpha-council) e a persona
global viviam só em `~/.claude/`, fora de qualquer backup. Qualquer perda de disco ou máquina nova exigia
reconstrução manual. Além disso, 40 de 42 skills em `~/.claude/skills/` eram **cópias** não-simbólicas,
desincronizando o runtime do repo sem que ninguém notasse.

**O que foi descartado e por quê:** descartado versionar `~/.claude/settings.json` diretamente — o arquivo contém
`ANTHROPIC_AUTH_TOKEN` (e outros secrets). Em vez disso, cria-se `context/claude/settings.example.json`
com `${ANTHROPIC_AUTH_TOKEN}` como placeholder; o sync script injeta o token real do runtime existente (ou do
`~/projetos/.env`) ao gerar `~/.claude/settings.json`. O `ANTHROPIC_AUTH_TOKEN` nunca cruza o repo.

Descartado também versionar `~/.hermes/` (34 MB de bases) — só os arquivos de config interessam, e já são mantidos
como template em `tijolao-ai/hermes/`.

Descartado converter `using-superpowers` em symlink — é um **plugin** do marketplace (1,2 MB, 6 sub-skills), não uma
skill do repo. Permanece como cópia em `~/.claude/skills/`.

**Como verificar que continua valendo:**
```bash
# 1. Nenhum secret no repo context/
grep -rn 'sk-[a-zA-Z0-9]\{10,\}' ~/projetos/claude/context/   # tem que sair vazio

# 2. Symlinks todos corretos
find ~/.claude/skills/ -xtype l                                # vazio = nenhum quebrado
ls ~/.claude/skills/ | wc -l                                   # 43 (42 symlinks + 1 plugin)

# 3. Sync script executa e preserva token
python3 ~/projetos/claude/scripts/sync-claude-config.py --apply
python3 -c "import json; s=json.load(open('/home/dr/.claude/settings.json')); print('token OK:', s['env']['ANTHROPIC_AUTH_TOKEN'][:10])"
```


---

### 16. Limpeza de 11-out-2026: agentes e docs removidos, runtime em `$CLAUDE_CONFIG_DIR`, repos em `~/src` (11-out-2026)

**Decisão:** (a) o operador apagou 11 subagentes (`arquiteto`, `clinical-data-auditor`, `code-explainer`,
`deploy-sentinel`, `documentador`, `onboarder`, `otimizador`, `pubmed-evidence-checker`, `refatorador`, `segurador`,
`testador`), docs/OPERATING-MANUAL.md, docs/REPOSITORY-INVENTORY.md, context/codex/ e context/memory/;
(b) os documentos vivos passam a citar os caminhos reais: repo em `~/src/Claude-workspace`, scripts em `~/src/scripts`,
cofre em `~/.local/secrets/.env`, runtime do Claude Code em `$CLAUDE_CONFIG_DIR` (`~/.config/claude`); (c) os números
publicados ficam em `README.md` ("Números medidos") e `CLAUDE.md` §1, sem inventário separado. (d) o sistema de modos de skills (`modo` e `modo-de-skills.sh`) foi apagado — nunca esteve registrado
no runtime atual; (e) o remoto passa a ser `doutortenente/claude-workspace`, novo nome do repo no GitHub.

**Problema que resolveu:** `~/projetos/` deixou de existir e o runtime saiu de `~/.claude/`; documento, hook e script
citavam caminho morto, e 11 agentes e 2 docs descreviam uma frota que o operador já tinha abandonado.

**O que foi descartado e por quê:** descartado manter o REPOSITORY-INVENTORY.md — era segundo lugar para o mesmo
número, e cópia num segundo lugar apodrece (decisão 1). Descartado reescrever `DECISIONS.md` e `agents/CHANGELOG.md`
com os caminhos novos: são registro histórico e citam o que valia na data.

**Como verificar que continua valendo:**
```bash
cd ~/src/Claude-workspace
git ls-files | xargs grep -l '~/projetos' | grep -vE 'DECISIONS|CHANGELOG|auditoria-2026'   # vazio
find skills-que-prestam -mindepth 3 -maxdepth 3 -name SKILL.md | wc -l                       # 41
find agents -mindepth 1 -maxdepth 1 -type d | wc -l                                          # 8 (7 agentes + docs/)
```

---

## Como adicionar uma decisão aqui

Entra decisão que **fecha uma porta** — que impede alguém de refazer amanhã o que já foi resolvido hoje. Preferência de
estilo, ajuste pontual e tarefa concluída não entram.

1. Numere na sequência, com a data em que a decisão foi tomada (não a data em que foi escrita aqui).
2. Preencha os quatro campos. Se você não sabe dizer **o que foi descartado**, não era uma decisão — era um passo.
3. O campo de verificação precisa ser comando executável ou checagem objetiva. "Revisar manualmente" não serve.
4. Acrescente a linha na tabela do topo.
5. Não repita o que o [`CLAUDE.md`](../CLAUDE.md) já diz. Ele dá a regra; aqui está o motivo.
