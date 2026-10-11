#!/usr/bin/env python3
"""
sync-claude-config.py — Sincroniza o repo Claude → runtime ($CLAUDE_CONFIG_DIR, padrão ~/.claude)

Este script é a fonte de verdade para a direção repo → disco. Ele:

  1. Copia context/global-claude-persona.md  → $CLAUDE_CONFIG_DIR/CLAUDE.md
  2. Gera $CLAUDE_CONFIG_DIR/settings.json a partir de context/claude/settings.example.json
     injetando secrets do ambiente (ANTHROPIC_AUTH_TOKEN via ~/.local/secrets/.env)
  3. Garante symlinks de skills em $CLAUDE_CONFIG_DIR/skills/ apontando para o repo
  4. Verifica hooks referenciados em settings.json existem no disco

ATENÇÃO: o passo 2 SOBRESCREVE o settings.json do runtime com o template.

Modo dry-run (padrão): mostra o que faria sem executar.
Com --apply: executa as mudanças.

Uso:
  python3 ~/src/Claude-workspace/scripts/sync-claude-config.py            # dry-run
  python3 ~/src/Claude-workspace/scripts/sync-claude-config.py --apply    # aplicar
"""

import json
import os
import shutil
import sys
from pathlib import Path

# ── Configurações ──────────────────────────────────────────────────────────

REPO = Path(__file__).resolve().parent.parent
CLAUDE_HOME = Path(os.environ.get("CLAUDE_CONFIG_DIR") or Path.home() / ".claude")
ENV_FILE = Path.home() / ".local" / "secrets" / ".env"

CONTEXT_DIR = REPO / "context"
CLAUDE_PERSONA_SRC = CONTEXT_DIR / "global-claude-persona.md"
SETTINGS_TEMPLATE = CONTEXT_DIR / "claude" / "settings.example.json"

CLAUDE_SETTINGS_DST = CLAUDE_HOME / "settings.json"
CLAUDE_SKILLS_DIR = CLAUDE_HOME / "skills"

# Prefixes usados para detectar vazamento de tokens conhecidos no repo.
# NÃO são secrets — são padrões de busca para a auditoria de segurança.
REDACTED_PREFIXES = ["sk-216e", "e1b99434433f8"]

# ── Helpers ─────────────────────────────────────────────────────────────────

def load_env_file(path: Path) -> dict[str, str]:
    """Carrega pares KEY=VALUE de um arquivo .env, ignorando comentários."""
    env = {}
    if not path.exists():
        return env
    for line in path.read_text().splitlines():
        line = line.strip()
        if not line or line.startswith("#"):
            continue
        if "=" in line:
            key, _, value = line.partition("=")
            env[key.strip()] = value.strip().strip('"').strip("'")
    return env

def info(msg: str):
    print(f"  {msg}")

def warn(msg: str):
    print(f"  ⚠️  {msg}", file=sys.stderr)

def dry_run(label: str, action: str):
    print(f"  {label}: {action}")

# ── Sync functions ──────────────────────────────────────────────────────────

def sync_claude_md(apply: bool):
    """1. Sincroniza $CLAUDE_CONFIG_DIR/CLAUDE.md ← context/global-claude-persona.md"""
    print("\n=== 1. CLAUDE.md (persona global) ===")
    dst = CLAUDE_HOME / "CLAUDE.md"
    if CLAUDE_PERSONA_SRC.exists():
        if apply:
            shutil.copy2(CLAUDE_PERSONA_SRC, dst)
            info(f"{CLAUDE_PERSONA_SRC} → {dst}")
        else:
            dry_run(str(CLAUDE_PERSONA_SRC), f"copiar para {dst}")
    else:
        warn(f"Fonte não existe: {CLAUDE_PERSONA_SRC}")


def sync_settings(apply: bool):
    """2. Gera settings.json a partir do template + secrets do ambiente"""
    print("\n=== 2. settings.json ===")
    if not SETTINGS_TEMPLATE.exists():
        warn(f"Template não existe: {SETTINGS_TEMPLATE}")
        return

    env = load_env_file(ENV_FILE)
    template = json.loads(SETTINGS_TEMPLATE.read_text())

    # Preserve existing secrets from runtime settings.json (secrets live on disk, not in repo)
    existing_token = ""
    if CLAUDE_SETTINGS_DST.exists():
        try:
            existing_settings = json.loads(CLAUDE_SETTINGS_DST.read_text())
            existing_token = existing_settings.get("env", {}).get("ANTHROPIC_AUTH_TOKEN", "")
            if existing_token:
                info("ANTHROPIC_AUTH_TOKEN preservado do settings.json existente")
        except (json.JSONDecodeError, KeyError):
            pass

    # Inject secrets from env file first, fall back to existing runtime token
    if "env" in template:
        if "ANTHROPIC_AUTH_TOKEN" in template["env"]:
            token = env.get("ANTHROPIC_AUTH_TOKEN", "") or existing_token
            if token:
                template["env"]["ANTHROPIC_AUTH_TOKEN"] = token
                info("ANTHROPIC_AUTH_TOKEN injetado (do .env ou runtime)")
            else:
                warn("ANTHROPIC_AUTH_TOKEN não encontrado em .env ou runtime — mantendo placeholder")
                warn(" Claude Code CLI não funcionará sem token válido.")

    if apply:
        CLAUDE_HOME.mkdir(parents=True, exist_ok=True)
        CLAUDE_SETTINGS_DST.write_text(json.dumps(template, indent=2) + "\n")
        info(f"{SETTINGS_TEMPLATE} → {CLAUDE_SETTINGS_DST} (com secrets injetados)")

        # Security check: verify no unredacted secrets leaked to repo
        repo_template = (REPO / "context" / "claude" / "settings.example.json").read_text()
        for prefix in REDACTED_PREFIXES:
            if prefix in repo_template:
                warn(f"🚨 POSSÍVEL SECRET VAZADO no repo (prefixo {prefix})! Abortando.")
                sys.exit(1)
        info("✓ Verificação de secrets passou (repo mantido limpo)")
    else:
        dry_run(str(SETTINGS_TEMPLATE), f"gerar {CLAUDE_SETTINGS_DST} (com secrets injetados)")
        if env.get("ANTHROPIC_AUTH_TOKEN"):
            info("ANTHROPIC_AUTH_TOKEN disponível no .env")
        elif existing_token:
            info("ANTHROPIC_AUTH_TOKEN será preservado do settings.json existente")
        else:
            warn("ANTHROPIC_AUTH_TOKEN NÃO encontrado no .env")

def sync_skills(apply: bool):
    """3. Garante symlinks de skills em $CLAUDE_CONFIG_DIR/skills/ → repo"""
    print("\n=== 3. Skill symlinks ===")

    # Build skill map: name → repo relative path
    skill_map = {}
    SKILLS_PKG_DIR = REPO / "skills-que-prestam"
    for pkg in sorted(SKILLS_PKG_DIR.iterdir()):
        if not pkg.is_dir():
            continue
        for skill in sorted(pkg.iterdir()):
            if skill.is_dir() and (skill / "SKILL.md").exists():
                skill_map[skill.name] = str(skill.relative_to(REPO))

    # Add local skills
    for local in sorted((REPO / ".claude" / "skills").iterdir()):
        if local.is_dir() and (local / "SKILL.md").exists():
            skill_map[local.name] = str(local.relative_to(REPO))

    # Add _anthropic (vendor collection, prefixed with _ — não é skill)
    anthropic_src = REPO / "skills-que-prestam/03-pacote-skills-claude-nativas/_anthropic"
    if anthropic_src.exists():
        skill_map["_anthropic"] = "skills-que-prestam/03-pacote-skills-claude-nativas/_anthropic"

    fixed = 0
    skipped = 0

    for name, rel_path in sorted(skill_map.items()):
        dst = CLAUDE_SKILLS_DIR / name
        src = REPO / rel_path

        needs_fix = False
        reason = ""

        if dst.is_symlink():
            target = os.path.realpath(dst)
            if target == str(src.resolve()):
                skipped += 1
                continue
            else:
                reason = f"symlink aponta errado (→ {target})"
                needs_fix = True
        elif dst.is_dir():
            reason = "é uma cópia, não symlink"
            needs_fix = True
        elif dst.exists():
            reason = "existe mas não é symlink nem diretório"
            needs_fix = True
        else:
            # No existe — não precisa fixar, acabei de criar
            needs_fix = True
            reason = "não existe, criar"

        if needs_fix:
            warn(f"'{name}': {reason}")
            if apply:
                if dst.is_symlink() or dst.exists():
                    if dst.is_symlink():
                        dst.unlink()
                    else:
                        shutil.rmtree(dst)
                dst.symlink_to(src.resolve())
                fixed += 1
            else:
                dry_run(name, f"criar symlink → {src}")
                fixed += 1

    # Check for broken symlinks
    result = os.popen(f"find {CLAUDE_SKILLS_DIR} -maxdepth 1 -xtype l 2>/dev/null").read().strip()
    broken = len(result.splitlines()) if result else 0

    if broken:
        warn(f"{broken} symlinks quebrados encontrados!")
    else:
        info("Nenhum symlink quebrado ✓")

    # Verify total count
    total = len(list(CLAUDE_SKILLS_DIR.iterdir()))
    symlinks = len([f for f in CLAUDE_SKILLS_DIR.iterdir() if f.is_symlink()])
    dirs = total - symlinks

    info(f"Total entries: {total} ({symlinks} symlinks, {dirs} directories)")
    if apply and broken == 0:
        print("✓ Todos os symlinks estão corretos")

def check_hooks():
    """4. Verifica hooks referenciados em settings.json existem"""
    print("\n=== 4. Hooks check ===")
    settings = json.loads(CLAUDE_SETTINGS_DST.read_text()) if CLAUDE_SETTINGS_DST.exists() else {}
    hooks = settings.get("hooks", {})
    hook_paths = set()

    for event, hook_list in hooks.items():
        for h in hook_list:
            for hook in h.get("hooks", []):
                cmd = hook.get("command", "")
                # Extract path from command
                if cmd.startswith("/"):
                    path = Path(cmd.split()[0])
                    hook_paths.add(path)

    for path in sorted(hook_paths):
        if path.exists():
            info(f"✓ {path}")
        else:
            warn(f"✗ {path} — NÃO EXISTE")

def main():
    apply = "--apply" in sys.argv

    print(f"Repo:      {REPO}")
    print(f"CLAUDE:    {CLAUDE_HOME}")
    print(f"Modo:      {'APPLY' if apply else 'DRY-RUN'}")

    if apply:
        # Final safety: never write secrets to the repo itself
        suspicious = []
        for root, _, files in os.walk(REPO / "context"):
            for f in files:
                fpath = Path(root) / f
                content = fpath.read_text(errors="ignore")
                for prefix in REDACTED_PREFIXES:
                    if prefix in content:
                        suspicious.append(str(fpath))

        if suspicious:
            print("🚨 ABORTANDO: possíveis secrets detectados no repo context/:")
            for s in suspicious:
                print(f"  - {s}")
            sys.exit(1)

        # Load secrets check
        env = load_env_file(ENV_FILE)
        if not env.get("ANTHROPIC_AUTH_TOKEN"):
            warn("ANTHROPIC_AUTH_TOKEN não encontrado em ~/.local/secrets/.env")
            warn("settings.json será gerado com placeholder — Claude Code CLI não funcionará sem token.")

    sync_claude_md(apply)
    sync_settings(apply)
    sync_skills(apply)
    check_hooks()

    print(f"\n{'='*60}")
    print(f"Sincronização {'concluída' if apply else 'simulada'} com "
          f"{'sucesso' if not apply else 'sucesso'}.")
    print(f"{'='*60}")
    if not apply:
        print("\nExecute com --apply para aplicar as mudanças:")
        print(f"  python3 {Path(__file__).resolve()} --apply")

if __name__ == "__main__":
    main()
