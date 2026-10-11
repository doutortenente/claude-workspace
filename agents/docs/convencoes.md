# Convenções da frota — como se escreve um agente aqui

Régua para criar ou alterar qualquer agente. Quem não segue, vira agente fantasma ou fica fora da frota.

## Uma pasta por agente

```
agents/<nome>/
├── <nome>.md      o agente — cabeçalho YAML + corpo
└── README.md      documentação — SEM cabeçalho YAML
```

A varredura de `agents/` é recursiva ([spec oficial](https://code.claude.com/docs/en/sub-agents.md)):
todo `.md` com `name` + `description` no cabeçalho vira agente, em qualquer nível. Duas consequências
que já morderam:

1. **README de pasta não leva cabeçalho YAML** — viraria um segundo agente com o mesmo assunto.
2. **Não existe forma documentada de excluir um arquivo da varredura.** Não há `.agentignore`, prefixo
   especial nem campo `disabled`. A única saída é o arquivo não ter cabeçalho válido. Foi assim que o
   antigo `_template.md` virou um agente fantasma chamado `nome-em-kebab-case`.

O nome do arquivo não precisa bater com o campo `name` — a identidade vem só do cabeçalho.

## Frontmatter

Fonte: [spec oficial de subagentes](https://code.claude.com/docs/en/sub-agents.md). Só `name` e `description`
são obrigatórios.

```yaml
---
name: nome-em-kebab-case
description: <quando delegar — gatilhos, não processo>
tools: Read, Grep, Glob, Bash
disallowedTools: Agent
model: haiku | sonnet | opus
---
```

**O padrão da casa são esses 5.** `disallowedTools: Agent` não é enfeite: a plataforma permite um subagente
despachar outro até **3 camadas** de profundidade. A doutrina de 2 níveis desta frota só existe de verdade
porque esse campo nega a ferramenta.

Campos válidos que a frota ainda não usa, e quando valeriam:

| Campo | Para quê |
|---|---|
| `effort` | `low`/`medium`/`high`/`xhigh`/`max` — regula quanto o modelo raciocina. Barateia agente mecânico |
| `isolation: worktree` | Dá ao agente uma cópia isolada do repositório. Serve para agente de escrita rodar em paralelo sem pisar no outro |
| `skills` | Pré-carrega o conteúdo de uma skill no contexto do agente. Custa token em toda invocação |
| `memory` | `user`/`project`/`local` — memória que sobrevive entre sessões |
| `mcpServers` | Servidor MCP exclusivo daquele agente |
| `hooks` | Hook de ciclo de vida escopado ao agente |
| `background` | Força rodar em segundo plano |
| `permissionMode` | Modo de confirmação. **Toda a frota usa `bypassPermissions`** — ver seção abaixo |
| `maxTurns` | Teto de turnos. Rede contra agente que entra em laço |
| `color` | Cor no painel de tarefas, cosmético |

Campo que **não** existe: `allowedTools` (o certo é `tools`), `allowed-tools`, `temperature`.

Se `tools` for omitido, o agente herda todas as ferramentas — quase nunca é o que você quer.

## A `description` diz QUANDO, não COMO

O Claude lê a `description` pra decidir se delega. Se ela resumir o procedimento, o Claude segue o resumo e
**pula o corpo do agente**. Isso é comportamento medido, não teoria: uma descrição que dizia "revisão de código
entre tarefas" fez o modelo executar 1 revisão onde o corpo mandava 2.

```yaml
# ✗ resume o processo — o corpo vira decoração
description: Verificador adversarial. Roda testes, confere cada claim contra a fonte, procura caso-limite.

# ✓ só gatilho — o corpo é lido
description: Use depois de qualquer entrega substantiva de outro subagente e antes de aceitar conclusão que vá
  motivar merge, deleção ou gravação em banco.
```

Escreva em 3ª pessoa. Inclua os termos que o gerente usaria ("tá lento", "antes de mergear", "me explica").
Inclua também **quando NÃO usar**, se houver agente vizinho — é isso que evita despacho errado.

## Corpo: 4 seções, nesta ordem

```markdown
<1 parágrafo: quem você é e qual erro seu é inaceitável>

## Método
<passos numerados — o que fazer, na ordem>

## Formato de saída
<o que devolver; herda docs/contrato-de-relatorio.md>

## Travas
<o que NUNCA fazer, com o porquê colado>
```

**Teto de 60 linhas.** Passou disso, o conteúdo extra vira arquivo em `docs/` e o agente aponta pra lá.
Agente longo é agente que o modelo lê pela metade.

## Travas com o porquê colado

Regra sem motivo é regra que o modelo racionaliza sob pressão. Feche a saída junto com a proibição:

```markdown
# ✗ fraco
- Não edita nada.

# ✓ fecha o loophole
- Não edita nem conserta nada — achou defeito, devolve pro gerente. Consertar contamina a fiscalização:
  quem conserta passa a ter interesse em aprovar o próprio conserto.
```

## Modelo por papel

| Modelo | Para quê | Agentes |
|---|---|---|
| `haiku` | mecânico, leitura pura, sem julgamento | batedor, caco, zelador |
| `sonnet` | implementação e verificação com escopo dado | residente, fiscal, secretaria, auditor-do-repo |
| `opus` | decide arquitetura, julga risco, audita dado clínico | chefe |

Regra: **o modelo mais barato que dá conta.** Se o agente só coleta e formata, é haiku. Se ele decide, é opus.

## Ferramentas: o mínimo

Agente de leitura **não recebe `Write` nem `Edit`** — a trava mais barata contra dano é não ter a ferramenta.
Ninguém na frota recebe autorização de push, merge, deleção ou gravação em banco: isso é decisão do gerente.

## Permissão: a frota inteira roda em `bypassPermissions`

Todo agente declara `permissionMode: bypassPermissions` — ordem do operador. Ele significa: o agente age sem
parar pra pedir confirmação a cada passo. Não é fé cega, é onde a trava mora: **a contenção é a lista `tools`**,
não o pedido de licença. Agente que não tem `Write` não escreve, tendo ou não permissão pra tentar.

Consequência prática ao escrever um agente novo: pense na linha `tools` como a única barreira real. Se você não
daria a ferramenta a um estagiário sem supervisão, não a coloque ali.

## Hierarquia de 2 níveis

Subagente não despacha subagente. **A plataforma NÃO garante isso** — o padrão dela são 3 camadas de
aninhamento. A trava é explícita: todo agente traz `disallowedTools: Agent` no frontmatter. Sem esse campo, a
doutrina é só um texto no corpo, e o modelo pode ignorá-la.

Quando a missão exigir coordenação (fan-out, pipeline, loop), o papel de líder é da ferramenta **Workflow**, que
é roteiro determinístico e não alucina passo de processo.

## Reconhecimento em `sasi`, `claude` e `celebro`

Comece pelo MCP `jetbrains-index` (`ide_find_file`, `ide_search_text`, `ide_find_references`), não por
`Glob`/`Grep` em massa. Ele entende tipo, import e referência; grep só vê texto.

**Nunca use `graphify`** — foi arrancado do repo (commit `2262a8f`) depois de 19 dias sem uso e de uma bronca
de custo. O comando não existe mais no PATH.
