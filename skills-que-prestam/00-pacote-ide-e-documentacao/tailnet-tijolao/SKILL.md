---
name: tailnet-tijolao
description: Operar a rede privada (Tailscale) do Tijolão e o que roda dentro dela — painel do Hermes, gateway, workspace, 9router. Aciona quando o operador disser "não consigo acessar do celular", "o Tailscale caiu", "adiciona esse aparelho na rede", "abre essa porta", "dá 401 no painel do Hermes", "não entra no dashboard", "o Tailscale diz que preciso logar mas eu já loguei", ou quando algo em 100.x.x.x não responder. Traz o estado medido da tailnet, o modo correto de autenticar no painel e as armadilhas que já custaram tempo aqui.
---

# A rede privada do Tijolão

Uma **tailnet** é uma rede particular que atravessa a internet: os aparelhos se enxergam como se estivessem na mesma sala, com endereços fixos que ninguém de fora alcança. Termos, traduzidos na primeira vez: **nó** = um aparelho dentro dela. **bind** = em qual endereço um programa fica escutando. **loopback** (`127.0.0.1`) = só esta máquina, ninguém mais. **drop-in** = arquivo que muda um pedaço de um serviço sem reescrever o original.

## Estado medido (05-set-2026)

| | |
|---|---|
| Tailnet | `tail9e88c5.ts.net` |
| Conta | `ntg.trabalho@gmail.com` |
| Nó | `tijolao` → `100.91.46.87` (IPv6 `fd7a:115c:a1e0::2001:2eee`) |
| Tailscale SSH | ligado (`RunSSH: true`) |
| Operador | `dr` — comanda sem `sudo` |
| Sobe no boot | sim (`tailscaled enabled`) |
| Outros aparelhos | nenhum até esta data |

Conferir de uma vez:
```bash
tailscale status
tailscale ip -4
```

## Armadilha nº 1: "eu já loguei" e ele insiste em `NeedsLogin`

Aconteceu em 05-set-2026 e custou várias rodadas. O `tailscale status` dizia `Logged out` **depois** do login ter dado certo no navegador.

Causa: processos `tailscale up` antigos, presos, segurando a resposta velha. Enquanto eles vivem, o status mente.

```bash
pgrep -af "tailscale up"        # se aparecer mais de um, é isso
sudo kill -9 <pids>             # mata os travados
tailscale status                # agora diz a verdade
```

Corolário: **logar no site não põe aparelho nenhum na rede.** O site confirma a conta. Cada aparelho entra pelo app instalado nele — iPhone e iPad pela App Store, servidor por `curl -fsSL https://tailscale.com/install.sh | sh`.

## Armadilha nº 2: o painel do Hermes não usa senha do jeito comum

O painel (porta 9119) **não** aceita a forma clássica `usuário:senha` na requisição. Isso devolve `401` e faz parecer que a senha está errada — perdi tempo com isso.

O caminho certo é `POST /auth/password-login`, com JSON, e o campo `provider` é obrigatório (sem ele: `422`). Bater em `/login` devolve `405`.

```bash
U=$(grep -m1 '^HERMES_DASHBOARD_USER=' ~/.local/secrets/.env | cut -d= -f2-)
P=$(grep -m1 '^HERMES_DASHBOARD_PASSWORD=' ~/.local/secrets/.env | cut -d= -f2-)
C=$(mktemp)
curl -s -c "$C" -X POST -H "Content-Type: application/json" \
  -d "{\"provider\":\"basic\",\"username\":\"$U\",\"password\":\"$P\"}" \
  http://100.91.46.87:9119/auth/password-login      # espera {"ok":true,"next":"/"}
curl -s -b "$C" http://100.91.46.87:9119/api/auth/me
```

Quem são os provedores de login: `curl -s http://100.91.46.87:9119/api/auth/providers`.

O código vive em `~/.hermes/hermes-agent/hermes_cli/dashboard_auth/routes.py` e o provedor de senha em `plugins/dashboard_auth/basic/__init__.py`.

## Armadilha nº 3: o Hermes recusa bind público sem autenticação

Desde o endurecimento de junho/2026, subir o painel fora do loopback **sem** provedor de login é recusado na cara — e a flag `--insecure` não faz mais nada. A mensagem é explícita e diz o que configurar.

Gerar o hash da senha (a senha em texto puro nunca fica no `config.yaml`):
```bash
cd ~/.hermes/hermes-agent
python3 -c "from plugins.dashboard_auth.basic import hash_password; print(hash_password('SUA-SENHA'))"
```
E no `~/.hermes/config.yaml`:
```yaml
dashboard:
  basic_auth:
    username: dr
    password_hash: 'scrypt$16384$...'
```

## Onde as coisas escutam

| Serviço | Porta | Bind | Alcance |
|---|---|---|---|
| Painel Hermes | 9119 | `100.91.46.87` | tailnet, com senha |
| Gateway Hermes | 8642 | `127.0.0.1` | só esta máquina |
| Workspace | 3000 | `127.0.0.1` | só esta máquina |
| n8n | 5678 | `127.0.0.1` | só esta máquina |
| Ollama | 11434 | `127.0.0.1` | só esta máquina |
| 9router | 20128 | `0.0.0.0` | tem chave na frente (ver `9router-master`) |

**O painel não responde mais em `127.0.0.1`** — o bind é único. Use `http://100.91.46.87:9119` inclusive nesta máquina. Nada no PC apontava para o endereço antigo quando isso mudou (conferido).

## Como o painel fica de pé

Não é processo solto: é serviço do sistema, sobrevive a reboot. O original força `--host 127.0.0.1`; um drop-in sobrescreve:

`~/.config/systemd/user/hermes-dashboard.service.d/tailnet.conf`
```ini
[Service]
ExecStart=
ExecStart=/home/dr/.hermes/hermes-agent/venv/bin/hermes dashboard --host 100.91.46.87 --port 9119 --no-open --skip-build
```
A linha `ExecStart=` vazia é obrigatória — sem ela o systemd soma os dois comandos em vez de trocar.

```bash
systemctl --user daemon-reload && systemctl --user restart hermes-dashboard.service
systemctl --user show hermes-dashboard.service -p ExecStart --value   # confere o que valeu
```

Serviços do Hermes: `hermes-dashboard`, `hermes-gateway`, `hermes-workspace` (todos `systemctl --user`).

## Firewall

Entrada é bloqueada por padrão; libera-se a interface da tailnet inteira, não porta a porta:

```bash
sudo ufw allow in on tailscale0 comment 'tailnet'
sudo ufw allow 41641/udp comment 'tailscale P2P'
sudo ufw status numbered
```

É isso que faz a LAN comum (`192.168.x`) não alcançar o painel mesmo com ele fora do loopback.

## Verificação

Uma mudança de exposição só está pronta quando os quatro passam:

```bash
curl -s -o /dev/null -w "%{http_code}\n" http://100.91.46.87:9119/api/sessions          # 401 sem sessão
curl -s -o /dev/null -w "%{http_code}\n" -b "$C" http://100.91.46.87:9119/api/sessions  # 200 com sessão
curl -s -o /dev/null -w "%{http_code}\n" -m 6 http://192.168.15.186:9119/               # 000 = LAN recusada
systemctl --user is-enabled hermes-dashboard.service                                     # enabled
```

`000` é o resultado **desejado** vindo da LAN: significa conexão recusada.

## Pendência conhecida

O endereço com cadeado (`https://tijolao.tail9e88c5.ts.net`) não funciona: a conta responde `500 — your Tailscale account does not support getting TLS certs`. Vem desligado de fábrica e **só liga no painel web** (login.tailscale.com → DNS → Enable HTTPS); não existe comando. `tailscale serve` fica pendurado até estourar o tempo enquanto isso não for feito — não insista, e não confunda com falha de rede.
