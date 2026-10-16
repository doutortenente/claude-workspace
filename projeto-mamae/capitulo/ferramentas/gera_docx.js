// Gera o capítulo em .docx (ABNT: A4, Times 12, 1,5, margens 3/2cm)
const fs = require('fs');
const path = require('path');
const {
  Document, Packer, Paragraph, TextRun, AlignmentType, FootnoteReferenceRun,
} = require('docx');

const BASE = __dirname;
const md = fs.readFileSync(path.join(BASE, 'capitulo-final.md'), 'utf8');

const FONTE = 'Times New Roman';
const CORPO = 24;      // half-points => 12pt
const NOTA = 20;       // 10pt
const TITULO = 28;     // 14pt

// converte **negrito** e *itálico* em TextRuns
function runs(texto, extra = {}) {
  const out = [];
  const re = /(\*\*[^*]+\*\*|\*[^*]+\*)/g;
  let ultimo = 0, m;
  while ((m = re.exec(texto)) !== null) {
    if (m.index > ultimo) out.push(new TextRun({ text: texto.slice(ultimo, m.index), font: FONTE, size: extra.size || CORPO, ...extra }));
    const bruto = m[0];
    if (bruto.startsWith('**')) {
      out.push(new TextRun({ text: bruto.slice(2, -2), bold: true, font: FONTE, size: extra.size || CORPO, ...extra }));
    } else {
      out.push(new TextRun({ text: bruto.slice(1, -1), italics: true, font: FONTE, size: extra.size || CORPO, ...extra }));
    }
    ultimo = m.index + bruto.length;
  }
  if (ultimo < texto.length) out.push(new TextRun({ text: texto.slice(ultimo), font: FONTE, size: extra.size || CORPO, ...extra }));
  return out;
}

const linhas = md.split('\n');
let titulo = '', autorLinha = '', notaAutora = '';
const corpo = [];
let emReferencias = false;

for (const linhaBruta of linhas) {
  const linha = linhaBruta.trimEnd();
  if (!linha.trim()) continue;
  if (linha.startsWith('# ') && !titulo) { titulo = linha.slice(2).trim(); continue; }
  if (linha.startsWith('[^autora]:')) { notaAutora = linha.replace('[^autora]:', '').trim(); continue; }
  if (linha.includes('[^autora]') && !autorLinha) { autorLinha = linha.replace('[^autora]', '').trim(); continue; }
  if (linha.startsWith('## ')) {
    const cab = linha.slice(3).trim();
    if (/^Refer/i.test(cab)) emReferencias = true;
    corpo.push(new Paragraph({
      children: runs(cab, { bold: true }),
      spacing: { before: 360, after: 240, line: 360, lineRule: 'auto' },
      alignment: AlignmentType.LEFT,
      keepNext: true,
    }));
    continue;
  }
  if (emReferencias) {
    corpo.push(new Paragraph({
      children: runs(linha),
      spacing: { after: 240, line: 240, lineRule: 'auto' },  // simples, espaço entre entradas
      alignment: AlignmentType.LEFT,
    }));
  } else {
    corpo.push(new Paragraph({
      children: runs(linha),
      spacing: { line: 360, lineRule: 'auto' },              // 1,5
      alignment: AlignmentType.JUSTIFIED,
      indent: { firstLine: 709 },                            // 1,25 cm
    }));
  }
}

const doc = new Document({
  footnotes: {
    1: { children: [new Paragraph({ children: runs(notaAutora, { size: NOTA }), alignment: AlignmentType.JUSTIFIED })] },
  },
  sections: [{
    properties: {
      page: { margin: { top: 1701, left: 1701, bottom: 1134, right: 1134 } }, // 3/3/2/2 cm
    },
    children: [
      new Paragraph({
        children: runs(titulo, { bold: true, size: TITULO }),
        alignment: AlignmentType.CENTER,
        spacing: { after: 240, line: 360, lineRule: 'auto' },
      }),
      new Paragraph({
        children: [...runs(autorLinha), new FootnoteReferenceRun(1)],
        alignment: AlignmentType.RIGHT,
        spacing: { after: 480, line: 360, lineRule: 'auto' },
      }),
      ...corpo,
    ],
  }],
});

Packer.toBuffer(doc).then(buf => {
  const saida = path.join(BASE, 'capitulo-experiencia-e-receptividade-da-escola.docx');
  fs.writeFileSync(saida, buf);
  console.log('gerado:', saida, buf.length, 'bytes');
});
