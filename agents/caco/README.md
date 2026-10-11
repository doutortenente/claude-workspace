# caco — documentação

## O que faz
Roda um script já existente e nomeado na missão, e devolve a saída fiel — exit code, números exatos, últimas
linhas relevantes. Não pensa, não conserta, não escreve nada.

## Quando despachar

| Situação | Por que caco e não o vizinho |
|---|---|
| "Roda `saude_pc.py` e me diz o resultado" | caco é braço puro; **chefe** (opus) é quem cria/altera script — usar chefe aqui é gastar token caro pra tarefa mecânica |
| Rodar reindexação, `saude_pc.py`, catálogo OneDrive já prontos | Script conhecido, sem decisão a tomar — perfil exato do caco |
| Coletar reconhecimento pontual (ler log, grep em repo) sem rodar script | Isso é o **batedor** (haiku, leitura pura) — caco existe pra EXECUTAR script, não pra varrer arquivo |
| Boletim de saúde do PC com checklist fixo | Isso é o **zelador** (haiku) — tem checklist próprio; caco roda o que a missão nomeia, sem checklist embutido |
| Script falhou e precisa diagnóstico/conserto | Volta pro **chefe** — caco reporta o erro cru e para, não investiga causa |

## Ferramentas e por quê

| Ferramenta | Para que serve aqui |
|---|---|
| `Bash` | Rodar o script nomeado na missão e capturar saída/exit code |
| `Read` | Conferir conteúdo de arquivo de saída ou log gerado pelo script, sem executar nada |
| `Grep` | Localizar trecho relevante dentro de saída/log grande, sem reler tudo |
| `Glob` | Confirmar caminho de arquivo antes de rodar (existe? está onde a missão disse?) |

Sem `Write`/`Edit` de propósito: caco não pode alterar nenhum arquivo — quem escreve ou conserta script é o chefe.
`disallowedTools: Agent` também de propósito: caco não pode despachar outro subagente (a frota tem hierarquia de
2 níveis — só quem despacha squad é a ferramenta Workflow, nunca um subagente empilhando outro).

## Dependências
Nenhuma além das ferramentas nativas e do script que a missão nomear. O agente não referencia nenhum caminho fixo
de script no próprio corpo — cada despacho precisa trazer o caminho completo (ex.: algo em
`~/src/scripts/pc/saude_pc.py`).

## Skills relacionadas
Nenhuma identificada — o arquivo do agente não referencia skill.

## Contexto que ele precisa receber
Caminho completo do script, modo (dry-run por padrão; `--apply` só com aprovação explícita do operador já registrada
na missão) e o que conta como sucesso na saída. Exemplo de despacho bom:

```
Rode ~/src/scripts/pc/saude_pc.py (sem flags, modo default).
Reporte exit code, RAM livre, disco livre e as últimas 10 linhas do boletim.
Timeout: 60s.
```

## Armadilhas conhecidas
Missão vaga sobre QUAL script rodar — caco não escolhe entre candidatos, só confirma com `ls` se o caminho dado
existe; se a missão não nomeou o script, o modo de falha mais provável é caco tentar adivinhar o caminho certo
por conta própria, o que a regra 1 do próprio agente proíbe.

## Como saber se ele fez um bom trabalho
A resposta tem os 3 blocos (`RODEI:`, `SAÍDA:`, `PENDÊNCIA:`), o exit code aparece explícito, nenhum número foi
arredondado ou completado sem estar na saída real, e segredo eventual em stdout virou `[SEGREDO]` no relato.
