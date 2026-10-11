# batedor — documentação

## O que faz
Reconhecimento barato: lê repo, pasta, doc grande, log ou saída de comando e devolve um resumo estruturado curto
(tabela/lista). Só leitura — não edita nada, não roda comando que muda estado.

## Quando despachar

| Situação | Por que este agente e não o vizinho |
|---|---|
| "Onde mora a função X no repo?" ou "o que esse log acusa?" | Reconhecimento pontual e barato (**haiku** = modelo mais leve, mais rápido e mais barato da frota) — não precisa de `caco` (roda script) nem `zelador` (checklist fixo de saúde) |
| Mapear estrutura de um repo inteiro antes de decidir arquitetura | `batedor` traz o fato bruto; mapa completo e navegável do repo é trabalho de sessão principal (ou de um agente de sonnet dedicado), não de `batedor` |
| Conferir se um `git` está à frente/atrás do remoto, contar arquivo numa pasta | Tarefa de leitura direta — `residente` é pra mexer em código, não pra reconhecimento |
| Varrer doc grande (ex.: `BRIEFING.md`) antes de uma decisão clínica ou técnica | Evita o gerente (agente principal) gastar contexto lendo o doc inteiro — `batedor` devolve só o resumo |

## Ferramentas e por quê

| Ferramenta | Para que serve aqui |
|---|---|
| `Read` | Ler arquivo específico (doc, config, código) |
| `Grep` | Buscar padrão de texto dentro de arquivos |
| `Glob` | Achar arquivo por nome/caminho |
| `Bash` | Rodar comando de leitura pura: `ls`, `find`, `git log/status/diff` (leitura), `wc`, `du` |

`disallowedTools: Agent` — **negado de propósito**: `batedor` não pode despachar outro subagente (hierarquia da
frota é de 2 níveis, só o gerente despacha). Sem `Edit`/`Write` no campo `tools` — também proposital: o agente do
arquivo é reconhecimento, não execução; ele não pode alterar nada que olhar. As "Proibições absolutas" no corpo do
agente reforçam isso na regra, não só na lista de ferramentas: proíbem `sudo`, `rm`/`mv`, redirecionamento que
crie/sobrescreva arquivo e instalação de pacote — mesmo que tecnicamente passassem pelo `Bash` liberado.

## Dependências
Nenhuma além das ferramentas nativas (não há script de `~/src/scripts/`, servidor MCP nem arquivo de
configuração citado no corpo do agente).

## Skills relacionadas
Nenhuma identificada no corpo do agente.

## Contexto que ele precisa receber
O gerente deve entregar a pergunta exata (não "olha esse repo" solto), o caminho/escopo a varrer e o formato de
saída esperado. Sem pergunta fechada o `batedor` não sabe onde cortar por volume.

Exemplo de despacho bom:
```
Missão: confirmar se o branch feature/x está à frente/atrás de origin/main e listar
o que mudou em frontend/src/lib/.
Escopo: repo ~/src/sasi, pasta frontend/src/lib/ apenas.
Critério de aceite: os 2 números de git rev-list (esquerda/direita) + lista de
arquivo:linha alterado.
```

## Armadilhas conhecidas
Incidente registrado no próprio arquivo (06-jul-2026): o agente já inverteu à-frente/atrás do `git` e inventou
conteúdo de pasta sem ter listado. Por isso o arquivo agora exige `git fetch` + `git rev-list --left-right --count`
antes de qualquer afirmação sobre remoto, e `ls` na pasta antes de afirmar o que ela contém. Se o relatório vier
com contagem ou conteúdo de pasta sem o comando correspondente rodado nesta missão, é sinal de recaída.

## Como saber se ele fez um bom trabalho
A resposta segue o formato fixo (`RESPOSTA:` / `MAPA:` / `NÃO VI / LIMITES:`), todo fato tem `arquivo:linha` ou
comando por trás, todo número veio de comando rodado na mesma missão (não de memória ou dedução), e segredo
encontrado aparece mascarado como `[SEGREDO]`, nunca em claro.
