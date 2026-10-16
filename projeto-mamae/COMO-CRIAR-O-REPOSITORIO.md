# Como criar o repositório definitivo `projeto-mamae` no GitHub

> **Por que este passo é manual?** A "chave de acesso" que o Claude usa nesta
> sessão (a integração do GitHub instalada na sua conta) só enxerga os
> repositórios já autorizados — ela não tem o poder de **criar** repositórios
> novos. Criar leva ~1 minuto no site.

## Passo a passo (2 cliques e um nome)

1. Acesse <https://github.com/new> (logado como `doutortenente`).
2. Preencha:
   - **Repository name:** `projeto-mamae`
   - **Description:** `Trabalhos acadêmicos da Profa. Dra. Luciana Lindoso Teixeira`
   - Marque **Private** (privado — importante: a pasta `fontes/` tem dados
     pessoais do currículo).
   - Pode marcar "Add a README" ou deixar vazio, tanto faz.
3. Clique em **Create repository**. Pronto.

## Depois de criado — como levar este conteúdo para lá

Numa próxima conversa com o Claude, basta pedir:

> "Adicione o repositório doutortenente/projeto-mamae à sessão e copie para lá o
> conteúdo da pasta projeto-mamae do repositório Claude."

O Claude fará: adicionar o repositório novo à sessão (ferramenta `add_repo`),
copiar esta pasta inteira para lá, copiar `config/settings-modelo.json` para
`.claude/settings.json` (a configuração "viva" do assistente), e enviar tudo
para o GitHub.

## Autorização da integração (se o repositório novo não aparecer)

Se o Claude disser que não enxerga o `projeto-mamae`, é porque a integração do
GitHub precisa ser autorizada para ele: em
<https://github.com/settings/installations> → **Claude** → **Repository access**,
inclua o `projeto-mamae` na lista (ou marque "All repositories").
