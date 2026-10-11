# Como mexer na frota

## Criar um agente novo

```bash
cd ~/src/Claude-workspace
mkdir agents/<nome>
# copiar os blocos de agents/docs/template-de-agente.md para agents/<nome>/<nome>.md
# escrever agents/<nome>/README.md com a documentação (SEM cabeçalho YAML)
head -8 agents/<nome>/<nome>.md      # confere name, description, model, tools
```

**Uma pasta por agente**, com o arquivo do agente e o `README.md` de documentação ao lado. O nome do
arquivo não precisa bater com nada — a identidade vem do campo `name` no cabeçalho — mas usar
`<nome>/<nome>.md` mantém a pasta legível.

**O `README.md` da pasta não pode ter cabeçalho YAML.** A varredura é recursiva e carrega todo `.md`
com `name` + `description` como agente; um README com cabeçalho vira agente fantasma.

Antes de escrever, responda 3 perguntas. Se travar em qualquer uma, o agente não deve existir:

1. **Que missão ele atende que nenhum dos 18 atende?** Sobreposição não resolvida vira despacho errado —
   o gerente chama um quando queria o outro, e ninguém percebe.
2. **Qual erro dele é inaceitável?** Isso vira o primeiro parágrafo do arquivo. Agente sem falha
   definida não tem como se autocorrigir.
3. **Ele precisa mesmo escrever?** Se só lê, não dê `Write` nem `Edit`. A trava mais barata contra dano
   é não ter a ferramenta.

## Alterar um agente existente

Mudança na `description` muda o **roteamento da frota inteira** — o gerente passa a delegar diferente.
Trate como mudança de comportamento, não de texto: altere, rode o validador e teste com uma missão real
antes de mergear.

Mudança no corpo é mais barata, mas vale a mesma regra do teto: 60 linhas. Passou disso, o excedente vira
arquivo em `docs/` e o agente aponta pra lá.

## Checklist antes do commit

- [ ] Cabeçalho confere com `docs/convencoes.md` (`name`, `description`, `model`, `tools`)
- [ ] Agente mora em `agents/<nome>/<nome>.md`, com `README.md` de documentação ao lado
- [ ] O `README.md` da pasta **não** tem cabeçalho YAML (senão vira agente fantasma)
- [ ] Cabeçalho só usa campos da spec oficial; `name` e `description` são obrigatórios
- [ ] `description` diz QUANDO delegar, não resume o procedimento
- [ ] `description` diz de qual agente vizinho ele se diferencia
- [ ] Corpo tem as 4 seções na ordem: identidade → `## Método` → `## Formato de saída` → `## Travas`
- [ ] Cada trava tem o porquê colado
- [ ] Arquivo com no máximo 60 linhas
- [ ] Agente sem `Write`/`Edit` não promete editar nada
- [ ] Zero emoji, zero menção a `graphify`
- [ ] `README.md` atualizado com a linha do agente novo
- [ ] `CHANGELOG.md` atualizado

## Testar um agente antes de confiar nele

Validador confere forma, não comportamento. Para saber se funciona:

1. Despache uma missão **de leitura** real, com resposta que você já conhece.
2. Confira se o relatório traz `NÃO VI` preenchido — agente que omite o que não olhou é o mais perigoso,
   porque faz cobertura parcial parecer total.
3. Só depois disso libere missão de escrita.

## Fluxo git

Branch de feature, push, PR, merge. Commit direto na `main` é proibido. Mensagem em português, estilo
Conventional Commits: `feat(agents):`, `docs(agents):`, `fix(agents):`.

## Onde NÃO mexer

| Coisa | Por quê |
| --- | --- |
| `$CLAUDE_CONFIG_DIR/agents` | É um symlink para este repositório. Edite em `agents/`, com Git e revisão. |
| `agents/docs/contrato-de-relatorio.md` isoladamente | Todo agente depende desse formato; qualquer mudança afeta os 18 de uma vez. |
| Scripts de infraestrutura dentro deste repositório | A casa única é `~/src/scripts/`; o validador da frota mora em `scripts/claude/`. |
