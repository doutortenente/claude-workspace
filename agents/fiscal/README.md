# fiscal — documentação

## O que faz
Verificador adversarial: recebe uma entrega já pronta (código, script, relatório, conclusão de outro agente) e
tenta REFUTAR cada afirmação dela com evidência real — não confirma por cortesia. Só aponta defeito, não conserta.

## Quando despachar

| Situação | Por que este agente e não o vizinho |
|---|---|
| Código do residente entregue como pronto | fiscal roda o teste de novo e confere arquivo:linha; escrever teste novo para código sem cobertura é outro papel (do `residente`, em missão própria) |
| Script de infra do chefe entregue | fiscal audita o claim ("funciona", "testei"); chefe não se autoverifica |
| Relatório do batedor com "arquivo X faz Y" | fiscal confere se o arquivo:linha citado existe de fato — batedor faz reconhecimento, não autoauditoria |
| Conclusão importante do gerente antes de virar decisão | fiscal é o único papel dedicado a tentar derrubar uma afirmação, não só lê-la |
| Entrega já testada e você só quer alterá-la | não despachar fiscal — sem Write/Edit ele não corrige nada, é o **residente** que mexe no código |

## Ferramentas e por quê

| Ferramenta | Para que serve aqui |
|---|---|
| Read | Reler a fonte citada pela entrega (arquivo, log, documento) para conferir se o claim bate |
| Grep | Localizar o texto exato que sustenta um claim, achar arquivo:linha real |
| Glob | Confirmar que um arquivo/caminho citado existe de verdade |
| Bash | Rodar de novo o teste, **build** (compilação do projeto) ou comando que a entrega alega ter rodado, e reproduzir a saída |

Ferramentas ausentes, de propósito: **Write/Edit** — fiscal não altera nada; achou defeito, devolve pro gerente
consertar com outro agente. Misturar "verificar" com "corrigir" contamina a fiscalização.
`disallowedTools: Agent` — fiscal não pode despachar outro subagente; a verificação tem que ser feita por ele mesmo,
não terceirizada, e isso mantém a hierarquia em 2 níveis (gerente → fiscal, sem fiscal virar líder de squad).

## Dependências
Nenhuma além das ferramentas nativas listadas acima. O corpo do agente não cita script de `~/src/scripts/`,
servidor **MCP** (protocolo de ferramenta externa) nem arquivo de configuração fixo — ele reaproveita, via Bash, o
comando de teste/build que a própria entrega já usa (ex.: Vitest, typecheck), sem nome fixado no arquivo.

## Skills relacionadas
Nenhuma identificada no corpo do agente.

## Contexto que ele precisa receber
O gerente deve entregar: (1) caminho exato da entrega a auditar, (2) a lista de claims que a entrega fez
("testei X", "isso corrige Y"), (3) como rodar de novo o teste/comando original, (4) o que conta como aprovação.
Sem isso o fiscal lista claims genéricos demais e a auditoria fica rasa.

Exemplo de despacho bom:
```
Audite a entrega do residente em sasi/frontend/src/lib/exportPDF.ts (commit abc123).
Claims a verificar: "corrigi o warning de lint da linha 63", "typecheck passa limpo".
Rode: cd sasi/frontend && npm run lint && npm run typecheck.
Aprovação exige: 0 warning novo E typecheck sem erro.
```

## Armadilhas conhecidas
Maior risco deste agente: aceitar um claim como CONFIRMADO só porque é plausível, sem de fato rodar o comando —
a própria trava do agente manda escolher NÃO-VERIFICÁVEL na dúvida, mas sob pressão de tempo é fácil pular a
reprodução e confiar na palavra de quem entregou. Segundo risco: escopo vago do gerente ("verifica tudo") vira
lista de claims genéricos que não testam nada de específico.

## Como saber se ele fez um bom trabalho
A tabela `claim | veredito | evidência` tem uma linha por afirmação da entrega, e toda linha CONFIRMADO ou
REFUTADO traz arquivo:linha ou saída de comando real — nunca "parece correto". Toda linha NÃO-VERIFICÁVEL diz
exatamente o que faltou para checar. Fecha com um veredito geral único (APROVADO / REPROVADO / APROVADO COM
RESSALVAS) e nenhum segredo aparece em texto puro no relato.
