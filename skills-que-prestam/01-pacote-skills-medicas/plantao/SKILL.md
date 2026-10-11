---
name: plantao
description: >
  ATALHO DE PLANTÃO ("/plantao" ou palavra "plantão" + envio de dados brutos).
  Pipeline completo em 1 comando: Dr. Nicolas envia o material do plantão (censo
  CSV/XLSX, PDF de prescrição + folhas de sinais, evoluções coladas, labs) e a
  skill (1) EXTRAI sinais vitais, balanços e labs no formato da skill
  controles-vitais-janela (blocos copiar-e-colar por leito, Max–Min + flags),
  (2) ORGANIZA tudo num arquivo .md único com quadro tático + flags vermelhos,
  e (3) SOBE no OneDrive (pasta Passagem-de-turno) com verificação de hash.
  USE SEMPRE que Dr. Nicolas disser "plantao", "/plantao", "sobe o plantão",
  "controles" (sozinho ou com leito/janela), "roda o pipeline do plantão", ou
  simplesmente enviar censo + prescrições + evoluções num contexto de início de
  plantão — mesmo sem citar a palavra "skill". ZERO ALUCINAÇÃO herdada: campo
  ilegível = `?`, divergência entre fontes é registrada, nunca resolvida por
  palpite.
---

# 🪖 plantao — pipeline de início de plantão (envio → extrai → organiza → sobe)

> Criada 18-jul-2026 a pedido do operador ("Faça isso virar um Workflow, atalho").
> É um ATALHO ORQUESTRADOR: a doutrina de transcrição mora em
> `controles-vitais-janela` (fonte única — não duplicar regra aqui).

## Gatilhos acordados com o operador

- `/plantao` ou "plantão" + dados brutos → pipeline completo (extrai + organiza + sobe OneDrive + grava Supabase).
- **"controles"** (palavra sozinha) → só a extração formatada, sem subir.
    - "controles L8" → só o leito 8. "controles noturno" → recorta a janela noturna.
- "sobe o plantão" / "manda pro drive" → só a etapa de upload do material já extraído.

## Passo a passo

1. **Ingestão** — aceitar em qualquer combinação: censo (`.csv`/`.xlsx`, exportado do Excel do hospital), PDF de
   prescrição + folhas "PLANEJAMENTO ASSISTENCIAL"
   (foto/scan), evoluções médicas coladas no chat, labs colados ou em nota de parecer. CSV do censo costuma vir ISO-8859
   com colunas vazias → converter UTF-8 e extrair só células com conteúdo.
2. **Extração** — aplicar a skill `controles-vitais-janela` (Módulo A, modo extração pura) por leito: sinais Max–Min +
   flags, balanço (rodapés = verdade), labs seriados com seta, seção Outros (DVA/BIC, ATB com início, dispositivos,
   dextro/insulina, pendências). Janela default = a que a folha cobrir; rotular sempre.
3. **Organização** — montar UM `.md`: cabeçalho (UTI, data, janela, fontes) → quadro tático (1 linha/leito) → blocos por
   leito → Flags vermelhos → Atenção (divergências entre fontes SEMPRE listadas).
4. **Upload OneDrive** — nome `YYYY-MM-DD_clinico_sinais-labs-<uti>-<turno>.md`, destino
   `onedrive:Documentos-claude-e-importacao-drive/Passagem-de-turno/`:
   ```bash
   ~/.local/bin/rclone copyto <arquivo> "onedrive:Documentos-claude-e-importacao-drive/Passagem-de-turno/<nome>"
   ~/.local/bin/rclone check <dir-local> "onedrive:Documentos-claude-e-importacao-drive/Passagem-de-turno" --include "<nome-prefixo>*"
   ```
   Só declarar concluído com `0 differences found`.
5. **Gravação no Supabase** — via MCP `sasi_deploy_ingest`, um payload por leito:
   `paciente_upsert` (nome, idade, data_adm, gravidade, alergias, hd, dispositivos JSON, isolation ∈
   none/contact/droplet/aerosol), `evolucao_snapshot` (Ramo C:
   sistemas JSONB + impressao/conduta 1:1 pareadas), `eventos_clinicos[]`
   (labs/vitais com `confidence` ≥0.9 em dado conferido, `ts` real quando houver)
   e `pendencias[]` ({tarefa, prioridade}). Divergência entre fontes → gravar com
   `requires_review: true` + as duas versões no `source_text`, NUNCA arbitrar sozinho.
6. **Resposta no chat** — quadro tático + flags vermelhos + confirmação do upload. Blocos completos só se o operador
   pedir (ele já tem o arquivo).

## Regras

- Arquivo de trabalho em `$CLAUDE_JOB_DIR/tmp` (ou tmp da sessão) — nunca poluir
  `~/src` nem Downloads.
- Supabase DENTRO do pipeline (ordem do operador, 18-jul-2026: "inclua já colocar no supabase") — a gravação via
  `sasi_deploy_ingest` é etapa padrão; falha de MCP não bloqueia as etapas 1-4 (OneDrive primeiro, banco depois).
- Flag crítico achado na extração (hipoglicemia iminente, divergência de ATB, queda de diurese) SEMPRE sobe pro topo da
  resposta — o upload não engole alerta.
