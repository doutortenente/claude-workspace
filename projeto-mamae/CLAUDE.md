# CLAUDE.md — projeto-mamae

## DIRETRIZ MÁXIMA Nº 0 — INTERLOCUTORES NÃO SÃO PROGRAMADORES
O Dr. Tenente (Nicolas) é **médico intensivista**; a Profa. Luciana é **doutora em
Letras**. Nenhum dos dois é programador. Todo termo técnico de computação
(repositório, branch, commit, push, etc.) deve ser traduzido em 1 linha de
português comum na primeira vez que aparecer na resposta. Analogias do cotidiano
antes do jargão. Respostas sempre em **português brasileiro**.

## O que é este projeto

Espaço de trabalho acadêmico da Profa. Dra. **Luciana da Conceição Lindoso
Teixeira** (Letras/Língua Portuguesa). Aqui nascem capítulos de livro, artigos,
apresentações e materiais didáticos derivados da produção dela — em especial da
tese de doutorado:

> TEIXEIRA, L. C. L. **Português língua de acolhimento: da formação docente à
> prática pedagógica na inclusão de migrantes.** Tese (Doutorado em Letras) —
> Universidade Presbiteriana Mackenzie, São Paulo, 2025. Orientadora: Regina
> Helena Pires de Brito. <https://dspace.mackenzie.br/handle/10899/41877>

Campo: **estudos lusófonos**, **Português Língua de Acolhimento (PLAc)**,
formação docente, inclusão de alunos migrantes na escola brasileira.

## Regras para produção acadêmica neste projeto

1. **Fidelidade absoluta às fontes.** Nunca inventar dados, falas de sujeitos de
   pesquisa, resultados ou referências bibliográficas. Toda citação sai de
   `fontes/tese-texto-completo.txt` (ou de obra real verificada), com página.
2. **Norma ABNT** (sistema autor-data) para citações e referências, salvo pedido
   em contrário.
3. **Registro acadêmico** em português brasileiro culto; voz da autora em 1ª
   pessoa do plural, como é praxe na área.
4. **Medida de página:** ~2.400 caracteres com espaços ≈ 1 página A4 (Times 12,
   espaçamento 1,5). Usar essa régua quando houver meta de páginas.
5. **Privacidade:** o currículo em `fontes/` tem endereço e telefone — não copiar
   esses dados para textos publicáveis. Falas de alunos/professores da pesquisa
   já estão anonimizadas na tese; manter assim.
6. Entregáveis de texto ficam em Markdown (para revisão) **e** em `.docx` (para a
   Luciana editar no Word), sempre os dois.

## Estrutura

- `fontes/` — documentos-fonte (tese em PDF e texto puro, ficha catalográfica,
  currículo). Não editar; só consultar.
- `capitulo/` — capítulo de livro "experiência e receptividade da escola"
  (fichamentos + texto final).
- Novos trabalhos: criar pasta própria na raiz (ex.: `artigo-plac-2026/`).

## Origem e sincronização

Este projeto nasceu dentro do repositório `doutortenente/Claude` (pasta
`projeto-mamae/`) e foi desenhado para ser promovido a repositório próprio —
ver `COMO-CRIAR-O-REPOSITORIO.md`. As configurações do assistente em
`.claude/settings.json` derivam do template `settings/settings.json` do repo
`Claude` (sem os hooks do prompt-improver, que dependem de arquivos daquele repo).
