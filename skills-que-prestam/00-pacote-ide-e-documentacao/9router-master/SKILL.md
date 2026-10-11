---
name: 9router-master
description: Operar, diagnosticar e corrigir o 9Router — o roteador local de IA na porta 20128, por onde passam Claude Code, Codex, Hermes e qualquer cliente compatível com OpenAI. Aciona quando o operador disser "o 9router caiu", "deu 404 no modelo", "model not found", "tá caindo no fallback", "veio resposta ruim e não sei por quê", "não responde na porta 20128", "adiciona um provedor", "cria um combo", "quanto de quota sobrou", "perdi minhas conexões", ou quando qualquer ferramenta apontada para localhost:20128 falhar. Escrita a partir da documentação oficial e do código-fonte do repositório decolua/9router; cada afirmação tem fonte.
---

# 9Router — o roteador local de IA

O 9Router é um **entreposto**: as ferramentas de IA não falam direto com OpenAI, Anthropic ou Google — falam com ele, em `localhost:20128`, e ele decide para qual provedor mandar. Serve para gastar a assinatura já paga antes de gastar dinheiro novo, e para não parar de trabalhar quando um provedor cai.

Termos, traduzidos na primeira aparição: **provedor** = a empresa que roda o modelo. **prefixo/alias** = as letras antes da barra no nome do modelo, que dizem por qual provedor passar. **fallback** = o próximo da fila quando o primeiro falha. **quota** = quanto da assinatura já foi gasto. **cooldown** = tempo de castigo antes de tentar aquele provedor de novo.

> **Procedência.** Tudo abaixo vem da documentação oficial (`gitbook/content/en/`, `README.md`, `docs/ARCHITECTURE.md`), do código-fonte, ou das issues do repositório `decolua/9router`. Onde a doc se contradiz, a contradição está apontada em vez de resolvida. Onde não há fonte, está escrito `[SEM_FONTE]`.

---

## 1. A regra do prefixo — e a correção de um erro antigo

O roteador divide o nome do modelo **na primeira barra**. O que vem antes é o apelido do provedor; o que vem depois é repassado adiante.

```
cx/gpt-5.6-sol
│  └── modelo repassado ao provedor
└───── apelido: codex (OpenAI Codex)
```

Fonte: `parseModel`, em `open-sse/services/model.js`.

**O que acontece sem prefixo — atenção, versões anteriores desta skill erravam aqui.** Não é 404 automático. O código tenta, nesta ordem:

1. um **combo** com esse nome
2. a tabela de **apelidos** no SQLite
3. apelidos embutidos
4. **inferência por regex do nome do modelo**, com fallback final para `"openai"`

```js
const MODEL_PREFIX_PROVIDERS = [
  [/^claude-/, "anthropic"], [/^gemini-/, "gemini"],
  [/^gpt-/,    "openai"],    [/^o[134]/,   "openai"],
  [/^deepseek-/, "openrouter"],
];
// padrão: "openai"
```

Consequência prática: `gpt-5.6-sol` sem prefixo **não erra por falta de prefixo** — vira tentativa contra o provedor `openai`. Se não houver conexão `openai` configurada, aí sim falha. O sintoma parece o mesmo, a causa é outra — e diagnosticar pela causa errada custa tempo.

A resolução de apelido lê o SQLite **a cada requisição**: criar apelido não exige reiniciar.

Fontes: `open-sse/services/model.js` · `src/sse/services/model.js`

---

## 2. Prefixos dos provedores

O registro tem **123 arquivos** em `open-sse/providers/registry/` (contagem na branch `master`). Nem todos são chat — há TTS, transcrição, busca e embedding. A descrição do projeto diz "40+ provedores"; o README diz "100+ modelos".

| Prefixo | `id` | Categoria | `hasFree` no registro | Autentica por |
|---|---|---|---|---|
| `cx` | codex | oauth | — | OAuth |
| `cc` | claude | oauth | — | OAuth |
| `ag` | antigravity | oauth | — | OAuth |
| `gh` | github | oauth | — | OAuth |
| `cu` | cursor | oauth | — | OAuth |
| `ws` | windsurf | oauth | — | OAuth ou chave |
| `kimi` · `kmc` | kimi | oauth | — | OAuth ou chave |
| `gc` | gemini-cli | **free** | sim | OAuth Google |
| `kr` | kiro | **free** | — | OAuth |
| `gemini` | gemini | freeTier | sim | chave |
| `cf` | cloudflare-ai | freeTier | sim | chave + Account ID |
| `ps` | poolside | freeTier | **não** | chave |
| `openrouter` | openrouter | freeTier | sim | chave |
| `nvidia` | nvidia | freeTier | sim | chave |
| `ollama` | ollama | freeTier | sim | chave |
| `groq` | groq | apikey | sim | chave |
| `glm` | glm | apikey | — | chave |
| `ds` · `deepseek` | deepseek | apikey | — | chave |
| `minimax` | minimax | apikey | — | chave |
| `cerebras` | cerebras | apikey | — | chave |
| `mistral` | mistral | apikey | — | chave |
| `if` | iflow | — | — | OAuth |

Vários provedores aceitam mais de um apelido: `deepseek`/`ds`, `poolside`/`ps`, `cloudflare-ai`/`cf`, `kimi`/`kimi-coding`/`kmc`.

**Não confie nesta tabela para a lista viva — pergunte à máquina:**

```bash
K=$(grep -m1 '^NINEROUTER_KEY=' ~/.local/secrets/.env | cut -d= -f2-)
curl -s -H "Authorization: Bearer $K" http://127.0.0.1:20128/v1/models \
  | python3 -c 'import json,sys; m=json.load(sys.stdin).get("data",[]); print(len(m),"modelos"); [print(x["id"]) for x in m]'
```

Fontes: `open-sse/providers/registry/` · `gitbook/content/en/providers/free.md` · `README.md`

---

## 3. Combos — mais complicados do que a doc conta

**Combo** = lista ordenada de modelos com nome próprio. O nome do combo entra **no lugar do modelo**: `{"model": "producao-medica", ...}`.

O código implementa **três estratégias**, não só a fila (`open-sse/services/combo.js`):

| Estratégia | Comportamento |
|---|---|
| `fallback` (padrão) | tenta em ordem, do 1º ao último |
| `round-robin` | **rotaciona** entre os modelos, com N requisições grudadas em cada um antes de trocar |
| `fusion` | dispara vários e usa um modelo-juiz para escolher |

**Duas armadilhas que só o código revela:**

- **`round-robin` não é fila.** Se a estratégia estiver nesse modo, o modelo varia sem que nada tenha falhado. Ver modelo diferente ≠ ter havido erro.
- **Auto-switch por capacidade reordena o combo.** Se a requisição exige algo específico (visão, por exemplo), o modelo capaz é trazido para a frente. **O primeiro da sua lista nem sempre é o primeiro tentado.**

### Quando o roteador pula para o próximo

Regra literal de `open-sse/config/errorConfig.js`, avaliada de cima para baixo — texto primeiro, depois código de status:

| Gatilho | Tipo | Cooldown |
|---|---|---|
| "no credentials" | texto | 2 min |
| "request not allowed" | texto | 5 s |
| "improperly formed request" | texto | 2 min |
| "rate limit" · "too many requests" · "quota exceeded" · "capacity" · "overloaded" | texto | backoff exponencial |
| 401 · 402 · 403 · **404** | status | 2 min |
| 429 | status | backoff exponencial |
| **qualquer outro erro** | padrão | 30 s |

Backoff exponencial: base 2000 ms, dobra por nível, teto 5 min, nível máximo 15. Cooldown informado pelo provedor é capado em 30 min.

**O ponto mais perigoso do sistema inteiro:** o padrão é `shouldFallback: true` para **qualquer** erro não classificado. Não existe erro que impeça o pulo. Um erro de digitação seu no corpo da requisição **pula o modelo em vez de te avisar**. É a raiz da issue #3794, onde um `400` de parâmetro inválido vira trava de 300 s e chega ao cliente disfarçado de `429`.

O cooldown é **persistido** no banco (`rateLimitedUntil`): a conta punida continua punida entre requisições, e o nível de backoff só zera com um sucesso.

### Ordem dos modelos — a doc se contradiz

No mesmo arquivo, `combos.md` diz as duas coisas:

- "Ordene do **barato ao caro**" — pôr assinatura primeiro desperdiça cota em tarefa simples
- "**Exceção**: se o objetivo for maximizar a assinatura, ponha a assinatura primeiro"

A doc assume a tensão. Qual vale depende do seu objetivo — economizar dinheiro ou esgotar o que já foi pago.

**Regra unânime:** sempre termine o combo com um modelo grátis. É o que impede parada total quando a assinatura estoura.

Exemplo da doc oficial, ordenado por reset de quota:

```
Nome: reset-optimized
  1. cc/claude-opus-4-5   (reset 5h — manhã)
  2. gc/gemini-3-flash    (1K/dia — tarde)
  3. glm/glm-4.7          (reset 10h — noite)
  4. minimax/MiniMax-M2.1 (5h rolante — madrugada)
  5. if/kimi-k2-thinking  (ilimitado — emergência)
```

Fontes: `gitbook/content/en/features/combos.md` · `smart-routing.md` · `open-sse/services/combo.js` · `open-sse/services/accountFallback.js` · `open-sse/config/errorConfig.js`

---

## 4. Autenticação — o mecanismo real

Lido em `src/dashboardGuard.js`:

```js
async function canAccessPublicLlmApi(request) {
  if (isLocalRequest(request)) return true;          // 1. loopback passa
  if (await hasValidCliToken(request)) return true;  // 2. header x-9r-cli-token
  return await hasValidApiKey(request);              // 3. chave válida
}
```

Sem nenhum dos três: `401 {"error": "API key required for remote API access"}`.

**Isto explica por que bind em `0.0.0.0` não é buraco aberto:** há autenticação na frente. Um pedido vindo da LAN toma 401.

Detalhes finos que mordem:

- `isLocalRequest` exige peer de loopback **e**, se houver header `Origin`, que ele também seja loopback — defesa contra CSRF.
- O header `x-9r-via-proxy` (carimbado quando há headers de encaminhamento) **força** o pedido a não contar como local. Atrás de proxy reverso, a chave volta a ser exigida.
- A chave é aceita em `Authorization: Bearer`, `x-api-key`, `x-goog-api-key` ou query `?key=`.
- Rotas que abrem processo filho ou leem segredo do host — `/api/mcp/`, `/api/tunnel/*`, `/api/cli-tools/cowork-settings`, `/api/oauth/cursor/auto-import`, `/api/auth/reset-password` — são **local-only**, respondem 403 de fora.
- `/api/*` é **negar por padrão**: só a lista pública passa sem auth.
- `REQUIRE_API_KEY=true` (padrão `false`) força Bearer em `/v1/*`. Recomendado se exposto à internet.

**Formato da chave — contradição na doc:** o gitbook diz que começa com `9r_`; um exemplo do README usa `sk_9router`. Não resolvido.

Fontes: `src/dashboardGuard.js` · `src/proxy.js` · `README.md §env`

---

## 5. Onde as coisas moram — a doc se contradiz

| Item | README (mais novo) | `docs/ARCHITECTURE.md` | gitbook |
|---|---|---|---|
| Estado principal | `${DATA_DIR}/db/data.sqlite` | `${DATA_DIR}/db.json` | `~/.9router/db.json` |
| Uso | dentro do SQLite | `~/.9router/usage.json` + `log.txt` | — |
| Backups | `${DATA_DIR}/db/backups/` | — | — |
| Logs opcionais | `logs/` com `ENABLE_REQUEST_LOGS=true` | idem | `~/.9router/logs/` |

O README é a fonte mais recente e diz SQLite. A issue #3817 trata de corrupção de `~/.9router/db/data.sqlite`, o que corrobora o README. **ARCHITECTURE.md e o gitbook estão desatualizados neste ponto.**

Tabelas no banco: `SETTINGS`, `PROVIDER_CONNECTION` (guarda `apiKey`, `accessToken`, `refreshToken`, `rateLimitedUntil`, `testStatus`), `PROVIDER_NODE`, `MODEL_ALIAS`, `COMBO`, `API_KEY`, `USAGE_ENTRY`.

**Segredos:** tokens OAuth e chaves ficam em texto no banco local — a doc diz que a proteção é a permissão do sistema de arquivos. `JWT_SECRET` é auto-gerado em `~/.9router/jwt-secret`. A senha inicial padrão é `123456`, e a doc manda trocar em deploy real.

### Porta do painel — contradição

| Fonte | Painel |
|---|---|
| README (atual) | `http://localhost:20128` e `/dashboard` |
| gitbook `troubleshooting.md`, `localhost.md` | `http://localhost:3000` |
| `ARCHITECTURE.md` | `NEXT_PUBLIC_BASE_URL` padrão `:3000` |

O README é mais novo. O gitbook está velho aqui.

Fontes: `README.md` · `docs/ARCHITECTURE.md` · `gitbook/content/en/deployment/localhost.md`

---

## 6. Ligar as ferramentas

| Ferramenta | Configuração oficial |
|---|---|
| **Claude Code** (variável) | `ANTHROPIC_BASE_URL="http://localhost:20128/v1"`; opcionais `ANTHROPIC_DEFAULT_OPUS_MODEL`, `..._SONNET_MODEL`, `..._HAIKU_MODEL` |
| **Claude Code** (arquivo) | `~/.claude/config.json`: `{"anthropic_api_base": "http://localhost:20128/v1", "anthropic_api_key": "..."}` |
| **Codex CLI** | `OPENAI_BASE_URL` + `OPENAI_API_KEY` (chave do 9router) |
| **Cline · Continue · RooCode** | Provider "OpenAI Compatible", Base URL `http://localhost:20128/v1`, chave do painel |
| **Cursor IDE** | Settings → Models → Advanced. A doc diz que o Cursor **não aceita localhost** — exige endpoint em nuvem ou VPS |
| **SDK OpenAI genérico** | `base_url="http://localhost:20128/v1"` + `api_key` |

**Contradição da doc sobre o Codex:** o README usa `http://localhost:20128` **sem** `/v1`; o gitbook `integration/codex.md` usa **com** `/v1`. Teste os dois.

**Diferença Claude Code × Codex quanto à chave:** o gitbook do Claude Code mostra só a base URL, sem chave; o do Codex exige as duas variáveis. Isso é coerente com o gate de autenticação — de dentro da máquina, a chave é dispensável.

**Hermes não é ferramenta documentada pelo projeto.** O formato do `~/.hermes/config.yaml` é conhecimento local desta máquina, não da doc oficial. `[SEM_FONTE oficial]`

Fontes: `gitbook/content/en/integration/*.md` · `README.md` · `faq.md`

---

## 7. Endpoints reais

Verificados na árvore do repositório, em `src/app/api/v1/`:

`chat/completions` · `messages` · `messages/count_tokens` · `responses` · `responses/compact` · `models` · `models/[...model]` · `models/info` · `embeddings` · `images/generations` · `audio/speech` · `audio/transcriptions` · `audio/voices` · `videos/edits` · `videos/[id]` · `search`

Mais `/v1beta/models` (formato Gemini). Um rewrite em `next.config.mjs` mapeia `/v1/*` → `/api/v1/*`.

Gestão: `/api/health` · `/api/version` · `/api/settings` · `/api/keys` · `/api/providers` · `/api/combos` · `/api/models/alias` · `/api/usage/*` · `/api/oauth/*` · `/api/pricing` · `/api/sync/cloud`

**Rotas de uso que existem:** `/api/usage/stats`, `/chart`, `/history`, `/logs`, `/providers`, `/request-details`, `/request-logs`, `/stream`, `/[connectionId]`.

**Aviso:** o gitbook `quota-tracking.md` documenta `GET /api/quota` e `GET /api/usage?period=today`. **Não existe `src/app/api/quota` na árvore**, e `/api/usage` só aparece com subcaminhos. Trate esses dois exemplos como não verificados.

Fontes: `src/app/api/v1/` · `src/app/api/usage/` · `gitbook/content/en/features/quota-tracking.md`

---

## 8. Diagnóstico, na ordem

Cada passo elimina uma causa. Pular passo é perder tempo com a causa errada.

**1. O processo está de pé?**
```bash
ss -tlnp | grep 20128
```
Nada → não está rodando. Suba com `9router --no-browser`.

**2. Responde sem chave?**
```bash
curl -s -o /dev/null -w "%{http_code}\n" http://127.0.0.1:20128/v1/models
```
Em localhost, `200` é o esperado — o gate deixa loopback passar. **Não é falha.**

**3. Responde com chave?**
```bash
K=$(grep -m1 '^NINEROUTER_KEY=' ~/.local/secrets/.env | cut -d= -f2-)
curl -s -o /dev/null -w "%{http_code}\n" -H "Authorization: Bearer $K" \
  http://127.0.0.1:20128/v1/models
```
`401` = chave errada ou revogada. Emita outra no painel.

**4. O modelo responde, e quem respondeu?**
```bash
curl -s -m 90 -X POST http://127.0.0.1:20128/v1/chat/completions \
  -H "Authorization: Bearer $K" -H "Content-Type: application/json" \
  -d '{"model":"cx/gpt-5.6-sol","messages":[{"role":"user","content":"Responda apenas: PONG"}],"max_tokens":20}'
```
Este é o teste que **prova** a rota. Olhe o campo `model` da resposta: ele diz quem realmente respondeu. Pediu `cx/` e voltou outro? Houve fallback silencioso — a rota principal está quebrada mesmo que a resposta pareça boa.

**5. O painel é o último recurso, e ele pode mentir.** Ver seção 9.

---

## 9. O painel pode mentir — issue #3810

**Não use o status verde do painel como prova.** A issue #3810 (aberta) descreve: o painel mostra a conexão como *Valid/active* enquanto o banco guarda um 403 antigo, e o servidor continua usando credencial em cache **até reiniciar**.

Combinado com a issue #3811 (aberta) — o fallback é silencioso e não há atribuição por requisição de qual conta respondeu — a conclusão operacional é dura:

> **A única prova confiável de que a rota está boa é comparar o `model` pedido com o `model` devolvido numa requisição real.** Painel não prova. Ausência de erro não prova.

---

## 10. Tabela de erros

Da doc oficial (`troubleshooting.md`), com a causa segundo a doc:

| Sintoma | Causa | O que fazer |
|---|---|---|
| "Model not found" | provedor não conectado, erro de digitação, provedor inativo | conferir formato `prefixo/modelo`; `curl /v1/models`; reconectar |
| "Language model did not provide messages" | quota esgotada, chave inválida, modelo indisponível | painel → quota; combo de fallback; reconectar |
| Rate limiting / "Too many requests" | quota de assinatura (5h/diária/semanal), limite de API, concorrência | ver countdown; trocar para tier barato |
| "Unauthorized" intermitente | refresh OAuth falhou | esperar 30 s (tenta sozinho); senão Providers → Reconnect |
| `ECONNREFUSED` | não está rodando, porta bloqueada, firewall | `lsof -i :20128`; subir de novo |
| "Invalid API key" | chave errada, expirada ou não gerada | regerar em Settings → API Keys |
| Custo alto | modelo caro sem necessidade, sem fallback barato, contexto grande | Usage Stats; modelo mais barato; streaming |
| Lento demais | latência do provedor, contexto grande, rate limit | modelo rápido; `stream: true`; reduzir contexto |
| Combo não aparece no CLI | cache da ferramenta | reiniciar a ferramenta |
| Combo sempre usa o último | quota do primário esgotada ou orçamento estourado | conferir quota do 1º da lista |

---

## 11. Defeitos que a própria doc admite

De `docs/ARCHITECTURE.md`, seção *Known Architectural Notes*:

1. `usageDb` **ignora `DATA_DIR`** — grava em `~/.9router` fixo.
2. `/api/v1/route.js` devolve **lista estática** de modelos; não é a fonte real de `/v1/models`.
3. O logger grava **headers e corpo completos** quando ligado — a pasta `logs/` é material sensível.
4. Sync de nuvem depende de `NEXT_PUBLIC_BASE_URL` correto.
5. `INITIAL_PASSWORD` padrão `123456` deve ser trocado em deploy real.

### Issues abertas que mudam a operação

| # | O que é | Por que importa |
|---|---|---|
| **3817** | Corrupção silenciosa do SQLite destrói **todas** as conexões de provedor — duas vezes em 10 dias | `PRAGMA integrity_check` → "database disk image is malformed"; a UI mostra zero contas **sem erro nenhum**. **Faça backup de `~/.9router` antes de cada atualização.** |
| **3822** | PR que faz o banco falhar fechado antes de migrar base corrompida | correção do acima, ainda não mergeada |
| **3811** | Fallback silencioso sem atribuição por requisição | confirma que comparar `model` pedido × devolvido é hoje a única defesa |
| **3810** | `testStatus` fica velho: painel mostra Valid com 403 no banco | **o painel não serve de prova** |
| **3794** | Um 400 de parâmetro vira fallback, trava o modelo por 300 s e chega ao cliente como 429 | consequência direta do "fallback por padrão em qualquer erro" |
| **3789** | Gemini não-streaming reporta `total_tokens` zero | contagem de quota fica errada |
| **3787** | Combo some do painel ao definir `kind` via PUT | |
| **3799** | Incompatibilidade com o Vercel AI SDK (schemas de ferramenta, SSE forçado) | |
| **3796** | `ag/gemini-3.8-flash`: variação enorme de tempo até o primeiro token, incluindo silêncio infinito | |
| **3825** | `/v1/embeddings` rejeita entrada multimodal | |

---

## 12. Prática recomendada — o que a doc manda

**Ordem para gastar assinatura antes de dinheiro novo** (`subscription.md`):

1. Gemini CLI (grátis, 180K/mês)
2. Antigravity (grátis)
3. Assinaturas já pagas — Claude Code, Codex, Copilot
4. Tier barato — GLM, MiniMax
5. Grátis de emergência

**Combos:** sempre com grátis no fim · ordenar do barato ao caro (com a exceção da seção 3) · casar qualidade com a tarefa · considerar horário de reset · manter **vários** combos e trocar conforme o caso · monitorar Analytics → Combo Usage e reordenar se o fallback disparar demais.

**Tier grátis:** usar como emergência; testar prompt no grátis e guardar quota paga para código de produção.

**Segurança:** trocar `JWT_SECRET` · trocar `INITIAL_PASSWORD` · `REQUIRE_API_KEY=true` se exposto à internet · `AUTH_COOKIE_SECURE=true` atrás de HTTPS · tratar `logs/` como sensível quando `ENABLE_REQUEST_LOGS=true` · chave em variável de ambiente, nunca versionada.

**Operação:** **backup de `~/.9router` antes de atualização grande** (ver #3817) · verificar com `GET /api/settings` e `GET /api/v1/models` · `ENABLE_REQUEST_LOGS=true` para depurar integração.

O RTK (compressor de saída de ferramenta) vem ligado por padrão; a doc alega 20-40% de economia de token de entrada — **número da doc, não medido nesta máquina**.

---

## 13. Verificação — quando uma mudança está pronta

1. `/v1/models` devolve `200` com chave.
2. Um `chat/completions` no modelo principal devolve `200` **e** o campo `model` da resposta bate com o pedido.
3. Nenhuma linha de fallback nos logs durante o teste.

Falhou qualquer um: a rota está degradada, mesmo que a resposta pareça correta. **E o painel verde não substitui nenhum dos três** (issue #3810).
