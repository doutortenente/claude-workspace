# Frota de subagentes — fonte única

Editar um agente = editar e commitar **neste repo**. Para o Claude Code enxergá-lo, o arquivo `<nome>.md` precisa estar
em `$CLAUDE_CONFIG_DIR/agents/` (hoje `~/.config/claude/agents/`, que **não existe** — medido 11-out-2026) ou em
`.claude/agents/` do projeto aberto.

**8 agentes:** 7 aqui em `agents/` e o `auditor-do-repo` em `.claude/agents/`. Subagente é um assistente com contexto
próprio e instruções próprias: o gerente (a sessão principal) despacha uma missão, o subagente executa isolado e
devolve um relatório. Serve pra economizar contexto e pra especializar comportamento.

## Estrutura

Cada agente mora na própria pasta, com a documentação ao lado:

```
agents/
├── README.md              este índice
├── CONTRIBUTING.md        como criar e alterar agente
├── CHANGELOG.md           o que mudou, quando e por quê (histórico — cita agentes já removidos)
├── docs/                  contrato de relatório, convenções, roteamento, template,
│                          arsenal de scripts, auditoria
├── batedor/
│   ├── batedor.md         o agente (o que o Claude Code lê)
│   └── README.md          dependências, ferramentas, contexto, armadilhas
├── caco/ · chefe/ · fiscal/ · residente/ · secretaria/ · zelador/
```

A varredura de `agents/` é **recursiva**: qualquer `.md` com `name` e `description` no cabeçalho vira agente,
esteja em subpasta ou não. Por isso o `README.md` de cada pasta **não tem cabeçalho YAML** — se tivesse,
viraria um agente fantasma na lista da frota. Foi o que aconteceu com o antigo `_template.md`, hoje
neutralizado em [docs/template-de-agente.md](docs/template-de-agente.md).

## Como usar esta pasta

| Você quer | Vá para |
|---|---|
| Saber qual agente chamar | tabela abaixo + [docs/roteamento.md](docs/roteamento.md) |
| Entender um agente a fundo | o `README.md` dentro da pasta dele |
| Criar ou alterar um agente | [CONTRIBUTING.md](CONTRIBUTING.md) e [docs/template-de-agente.md](docs/template-de-agente.md) |
| Entender o padrão de escrita | [docs/convencoes.md](docs/convencoes.md) |
| Saber o que todo agente devolve | [docs/contrato-de-relatorio.md](docs/contrato-de-relatorio.md) |
| Achar o script de infra certo | [docs/arsenal-de-scripts.md](docs/arsenal-de-scripts.md) |
| Ver o que mudou e quando | [CHANGELOG.md](CHANGELOG.md) |

## A frota

| agente | model | modo | quando chamar |
|---|---|---|---|
| `batedor` | haiku | leitura | Mapear terreno antes de decidir: estrutura de repo, onde mora uma função, o que um log acusa |
| `caco` | haiku | leitura | Rodar script que já existe e devolver a saída fiel |
| `zelador` | haiku | leitura | Boletim de saúde do workspace com checklist fixo: repo sujo, disco, Downloads velho |
| `chefe` | opus | escrita | Criar ou alterar script de infra em `~/src/scripts` |
| `residente` | sonnet | escrita | Implementar código de produto já prescrito — edita, roda typecheck/teste, reporta |
| `fiscal` | sonnet | leitura | Refutar entrega pronta de outro agente antes de aceitar |
| `secretaria` | sonnet | escrita | Memória do operador — o que foi feito, o que está pendente (**aviso:** o arquivo-alvo `comando.md` não existe mais no repo nem na pasta de configuração) |
| `auditor-do-repo` | sonnet | leitura | Conferir se o que está escrito bate com o que está no disco (mora em `.claude/agents/`) |

## Pipelines que funcionam

| Situação | Sequência |
|---|---|
| Feature nova | `residente` → `fiscal` |
| Repo desconhecido, algo está lento | `batedor` (mapeia) → decisão do gerente → `residente` → `fiscal` |
| Bagunça no PC | `zelador` (mede) → `caco` (roda a rotina) |
| Doc do repo envelheceu | `auditor-do-repo` (aponta) → gerente corrige |
| Fim de sessão | `secretaria` |

## Regras de frota

1. **Subagente não despacha subagente.** Hierarquia de 2 níveis: gerente → subagente.
2. **Coordenação é papel da ferramenta Workflow**, não de empilhar agente. Workflow é roteiro
   determinístico — faz loop, pipeline e fan-out sem alucinar passo de processo, e cada etapa roda no
   modelo certo.
3. **Achado de leitura que vai disparar ação de risco não vira ação direto.** Merge, deleção, gravação em
   banco e push passam por conferência do gerente — 1 comando direto, ou o `fiscal` se a entrega for
   substantiva. Origem: 06-jul-2026, o `batedor` inverteu a direção do `git` e afirmou conteúdo de pasta
   vazia no mesmo dia.
4. **Modelo mais barato que dá conta.** haiku varre, sonnet implementa, opus julga.
5. **Nenhum agente faz push, merge, deleção ou gravação em banco.** Isso é decisão do gerente.
6. **Fan-out cabe em 3 agentes simultâneos.** 4 núcleos e 7,6 GiB de RAM: acima disso vira fila.
