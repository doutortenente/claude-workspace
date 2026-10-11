# residente — documentação

## O que faz
Executa no código uma mudança já prescrita pelo gerente — feature, fix ou refactor pontual, no SASI ou em
outro repo. Edita, roda **typecheck** (verificação de tipo sem rodar o programa) e teste, e reporta o
resultado exato. Não decide o quê construir, só como implementar o que já foi decidido.

## Quando despachar

| Situação | Por que residente e não o vizinho |
|---|---|
| Mudança de código com O QUÊ, ONDE e COMO já definidos | É o papel dele: executar prescrição literal, sem reabrir decisão de arquitetura |
| Decidir arquitetura, schema de banco ou cutoff clínico | Sobe pro gerente (nível Opus/staff) — residente está proibido de decidir isso |
| Reestruturar código para ficar mais limpo, sem prescrição linha a linha, decidindo a forma | sessão principal decide a forma; residente só reestrutura se a missão já disser exatamente o quê mudar |
| Conferir se a entrega de código está correta, achar furo escondido | `fiscal` — residente confere o próprio diff, não audita adversarialmente |
| Escrever teste para código que OUTRO agente ou pessoa já escreveu | missão própria — residente só escreve teste quando a lógica nova é dele mesmo nesta missão |
| Mapear repo inteiro antes de decidir onde mexer | `batedor` — residente recebe o arquivo já apontado, não explora o repo à toa |

## Ferramentas e por quê

| Ferramenta | Para que serve aqui |
|---|---|
| Read | Ler o arquivo prescrito e o código ao redor, pra seguir o padrão local (nomes, comentários) |
| Grep | Buscar padrão em texto quando o MCP `jetbrains-index` não cobre ou como reforço |
| Glob | Localizar arquivo por nome/caminho quando a missão não deu o caminho exato |
| Bash | Rodar `npm run typecheck`, `npm run build`, Vitest, e `git status`/`diff` pra conferir o próprio diff |
| Edit | Aplicar a mudança prescrita em arquivo existente |
| Write | Criar arquivo novo quando a prescrição exige (ex.: teste novo, componente novo) |

`disallowedTools: Agent` — residente não pode lançar outro subagente. A frota tem hierarquia de 2 níveis;
empilhar Opus/orquestração é papel do gerente, não do executor. Sem esse bloqueio ele poderia terceirizar a
própria missão e fugir do "confira antes de reportar".

## Dependências
- MCP `jetbrains-index` (`ide_find_definition`, `ide_find_references`) — navegação de código, citado no
  próprio corpo do agente como preferível a Read/Grep às cegas.
- Scripts npm do repo alvo: no SASI, `cd frontend && npm run typecheck` e `npm run build`; Vitest quando o
  módulo tocado já tem teste. **SASI v3 usa pnpm + Vitest; sasi-v2 usa npm e não tem script de teste** —
  conferir qual versão do repo está em jogo antes de cobrar teste que não existe.

## Skills relacionadas
`ide-index-mcp` — cobre o uso correto das ferramentas `ide_find_definition`/`ide_find_references` que o
próprio agente cita como preferência sobre busca cega.

## Contexto que ele precisa receber
O gerente deve entregar caminho de arquivo, a mudança exata e o critério de aceite — sem isso o residente
para e devolve a pergunta em vez de chutar.

```
Missão: em frontend/src/lib/exportPDF.ts, corrigir o erro de lint da linha 63
(ver claude/agents mapa de débitos #18) sem alterar a saída do PDF.
Critério de aceite: npm run lint sem erro nesse arquivo; npm run typecheck limpo;
se a correção alterar lógica, adicionar/ajustar teste Vitest do módulo.
Escopo: só esse arquivo.
```

## Armadilhas conhecidas
Prescrição vaga ("melhora esse trecho") empurra o residente a decidir API ou campo de tabela que ele não
conferiu existir — deve parar e perguntar, não chutar. Outro risco: ao rodar typecheck/build, encontrar
falha PRÉ-EXISTENTE (não causada pelo próprio diff) e tentar consertar por conta própria, estourando o
escopo cirúrgico — a regra do agente é reportar essa falha crua, não resolver.

## Como saber se ele fez um bom trabalho
Resposta segue exatamente `FIZ:` / `VERIFIQUEI:` / `PENDÊNCIA:`; `VERIFIQUEI:` traz o comando literal rodado
mais o exit code ou resultado exato (não "passou" sem prova); os arquivos tocados batem 1:1 com o que a
missão nomeou, sem extra "aproveitado"; se a prescrição envolvia lógica nova, o teste Vitest correspondente
está no diff.
