# Roteamento — qual agente para qual missão

Árvore de decisão do gerente. A pergunta é sempre a mesma: **o que a missão produz?**

## Decisão em 1 pergunta

| A missão produz… | Agente |
|---|---|
| …um resumo do terreno (onde mora X, o que tem nessa pasta, o que o log diz) | `batedor` |
| …a saída de um script que já existe | `caco` |
| …um boletim de saúde da máquina com checklist fixo | `zelador` |
| …código de produto novo ou alterado | `residente` |
| …um script de infra em `~/src/scripts` | `chefe` |
| …uma tentativa de derrubar as afirmações de uma entrega | `fiscal` |
| …a conferência de que o que está escrito no repo bate com o disco | `auditor-do-repo` |
| …memória do operador atualizada | `secretaria` |

## Confusões que custam caro

| Você ia chamar | Mas o certo é | Porque |
|---|---|---|
| `fiscal` pra saber se está lento | medir direto | `fiscal` verifica corretude, não desempenho |
| `fiscal` pra conferir caminho citado em documento | `auditor-do-repo` | `auditor-do-repo` compara texto × disco; `fiscal` refuta entrega |
| `secretaria` pra atualizar o README | sessão principal | `secretaria` cuida da memória do operador; README é doc de repo |
| `caco` pra criar um script | `chefe` | `caco` só roda o que já existe; quem projeta é o `chefe` |
| `batedor` pra alterar código | `residente` | `batedor` só lê |

## Quando NÃO despachar ninguém

- A resposta cabe em 1 comando que você mesmo roda. Subagente custa contexto de ida e volta.
- Você já tem a informação na conversa. Re-medir o que já foi medido é o desperdício mais comum.
- A tarefa é uma edição pequena e já decidida. Despachar `residente` pra trocar 3 linhas custa mais
  que fazer.

## Fan-out: quantos ao mesmo tempo

Máximo **3 simultâneos**. A máquina tem 4 núcleos e 7,6 GiB de RAM — acima disso os agentes entram em
fila e o ganho vira espera. Para coordenar mais que isso, use a ferramenta **Workflow**: ela é roteiro
determinístico (faz laço, pipeline e fan-out) e cada etapa roda no modelo certo.

**Nunca** dois agentes de escrita no mesmo arquivo ao mesmo tempo. Se precisar, use
`isolation: worktree` — cada um recebe uma cópia isolada do repositório.

## Portão de verificação

Todo achado de agente de leitura que vá disparar merge, deleção, gravação em banco ou push passa pelo
gerente antes. Conferência simples: 1 comando direto. Entrega substantiva: despache o `fiscal`.
