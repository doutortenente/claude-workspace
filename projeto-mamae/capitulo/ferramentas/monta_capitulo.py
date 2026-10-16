#!/usr/bin/env python3
"""Monta o capítulo final a partir das seções redigidas pelos agentes.

Uso: python3 monta_capitulo.py
Lê:  capitulo/secao-*.md (ordenadas pelo número) + titulo.txt + referencias.md (se existir)
Gera: capitulo-final.md e imprime contagem de caracteres/páginas por seção e total.
"""
import glob
import os
import re

BASE = os.path.dirname(os.path.abspath(__file__))
CAP = os.path.join(BASE, 'capitulo')
CHARS_POR_PAGINA = 2400

def num_secao(path):
    m = re.search(r'secao-(\d+)', os.path.basename(path))
    return int(m.group(1)) if m else 999

secoes = sorted(glob.glob(os.path.join(CAP, 'secao-*.md')), key=num_secao)
if not secoes:
    raise SystemExit('nenhuma seção encontrada em ' + CAP)

titulo_path = os.path.join(BASE, 'titulo.txt')
titulo = open(titulo_path).read().strip() if os.path.exists(titulo_path) else 'CAPÍTULO'

partes, total = [], 0
print(f'{"seção":<12} {"caracteres":>10} {"páginas":>8}')
for s in secoes:
    txt = open(s).read().strip()
    partes.append(txt)
    n = len(txt)
    total += n
    print(f'{os.path.basename(s):<12} {n:>10} {n / CHARS_POR_PAGINA:>8.1f}')

corpo = '\n\n'.join(partes)
print('-' * 34)
print(f'{"CORPO":<12} {total:>10} {total / CHARS_POR_PAGINA:>8.1f}  (alvo: 24–27 págs = 57.600–64.800)')

cabecalho = (f'# {titulo}\n\n'
             'Luciana da Conceição Lindoso Teixeira[^autora]\n\n'
             '[^autora]: Doutora em Letras pela Universidade Presbiteriana Mackenzie, '
             'mestra em Letras pela UNIFESP, professora de Língua Portuguesa. '
             'Capítulo derivado da tese *Português língua de acolhimento: da formação '
             'docente à prática pedagógica na inclusão de migrantes* (Mackenzie, 2025), '
             'orientada pela Profa. Dra. Regina Helena Pires de Brito.\n')

refs_path = os.path.join(CAP, 'referencias.md')
refs = ('\n\n' + open(refs_path).read().strip()) if os.path.exists(refs_path) else ''

final = cabecalho + '\n' + corpo + refs + '\n'
out = os.path.join(BASE, 'capitulo-final.md')
open(out, 'w').write(final)
print('gerado:', out, f'({len(final)} caracteres com cabeçalho e referências)')
