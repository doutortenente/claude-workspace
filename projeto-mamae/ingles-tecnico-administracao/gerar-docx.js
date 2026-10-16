const fs = require('fs');
const D = require('docx');
const {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, WidthType,
  BorderStyle, ShadingType, AlignmentType, PageBreak, VerticalAlign
} = D;

const W = 10650;                       // largura útil (A4 - margens)
const NONE = { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' };
const noBorders = { top: NONE, bottom: NONE, left: NONE, right: NONE, insideHorizontal: NONE, insideVertical: NONE };
const thin = { style: BorderStyle.SINGLE, size: 4, color: '444444' };
const boxBorders = { top: thin, bottom: thin, left: thin, right: thin, insideHorizontal: thin, insideVertical: thin };

// ---------- helpers ----------
const r = (text, o = {}) => new TextRun({ text, ...o });
const p = (children, o = {}) => new Paragraph({
  children: Array.isArray(children) ? children : [r(children)],
  spacing: { before: 0, after: 40, line: 240 }, ...o
});
const q = (num, text, extra = []) => p([r(num + ' ', { bold: true }), ...(typeof text === 'string' ? [r(text)] : text), ...extra],
  { spacing: { before: 90, after: 40, line: 240 } });
// linha de escrita: sublinhados largura cheia (o Word funde bordas de parágrafos
// consecutivos idênticos, então a borda inferior não serve para 2 linhas seguidas)
const blank = (n = 1) => Array.from({ length: n }, () => new Paragraph({
  children: [r('_'.repeat(104))], spacing: { before: 150, after: 30, line: 240 }
}));
const heading = (t) => new Paragraph({
  children: [r(t.toUpperCase(), { bold: true, size: 21 })],
  spacing: { before: 200, after: 90, line: 240 },
  shading: { type: ShadingType.CLEAR, color: 'auto', fill: 'E8E8E8' },
  border: { left: { style: BorderStyle.SINGLE, size: 18, color: '000000', space: 4 } }
});
const sub = (t) => p([r(t, { bold: true })], { spacing: { before: 150, after: 50, line: 240 } });
const tip = (t) => p([r(t, { italics: true, size: 18 })], {
  spacing: { before: 40, after: 60, line: 240 },
  border: { left: { style: BorderStyle.SINGLE, size: 8, color: '888888', space: 4 } }
});
const cell = (children, width, o = {}) => new TableCell({
  children: Array.isArray(children) ? children : [children],
  width: { size: width, type: WidthType.DXA },
  margins: { top: 40, bottom: 40, left: 90, right: 90 },
  verticalAlign: VerticalAlign.TOP, ...o
});
// tabela invisível de 2 colunas para itens a)–f)
const twoCol = (left, right) => new Table({
  columnWidths: [W / 2, W / 2], width: { size: W, type: WidthType.DXA }, borders: noBorders,
  rows: [new TableRow({
    children: [
      cell(left.map(t => p(t)), W / 2),
      cell(right.map(t => p(t)), W / 2)
    ]
  })]
});
const box = (children) => new Table({
  columnWidths: [W], width: { size: W, type: WidthType.DXA }, borders: boxBorders,
  rows: [new TableRow({ children: [cell(children, W)] })]
});
const dial = (who, text) => new Table({
  columnWidths: [1500, W - 1500], width: { size: W, type: WidthType.DXA }, borders: noBorders,
  rows: [new TableRow({
    children: [
      cell(p([r(who, { bold: true })]), 1500),
      cell(p(text), W - 1500)
    ]
  })]
});
const L = (n) => '_'.repeat(n);

// ---------- documento ----------
const doc = new Document({
  styles: {
    default: {
      document: {
        run: { font: 'Times New Roman', size: 20 },
        paragraph: { spacing: { after: 40, line: 240 } }
      }
    }
  },
  sections: [{
    properties: { page: { margin: { top: 567, bottom: 454, left: 624, right: 624 } } },
    children: [

      new Paragraph({
        children: [r('ATIVIDADE DIAGNÓSTICA DE LÍNGUA INGLESA', { bold: true, size: 27 })],
        alignment: AlignmentType.CENTER, spacing: { after: 40 }
      }),
      new Paragraph({
        children: [r('Curso Técnico em Administração — Inglês Instrumental / Comunicação Empresarial', { size: 19 })],
        alignment: AlignmentType.CENTER, spacing: { after: 120 }
      }),

      box([p([r('Aluno(a): ' + L(52) + '   Turma: ' + L(12))]),
           p([r('Data: ____ / ____ / ________     Docente: ' + L(38))])]),

      new Paragraph({ children: [r('')], spacing: { after: 60 } }),

      box([p([
        r('Leia antes de começar. ', { bold: true }),
        r('Esta atividade é '), r('diagnóstica', { bold: true }),
        r(': serve para o professor descobrir o que a turma já sabe e o que precisa ser retomado — '),
        r('não vale nota para aprovação', { bold: true }),
        r('. Duração: '), r('60 minutos', { bold: true }),
        r(' (15 min para o Bloco 1, 28 min para o Bloco 2, 10 min para o Bloco 3, 5 min para instruções e revisão). Você '),
        r('pode consultar o glossário', { bold: true }),
        r(' da última folha durante toda a atividade. '),
        r('Não é permitido', { bold: true }),
        r(' celular, tradutor ou dicionário. Se não souber, escreva '),
        r('"não sei"', { bold: true }),
        r(' em vez de deixar em branco — isso ajuda o professor a entender sua dificuldade.')
      ], { alignment: AlignmentType.JUSTIFIED })]),

      heading('Bloco 1 — Leitura e interpretação de texto'),

      box([
        new Paragraph({ children: [r('A Day at the Office', { bold: true })], alignment: AlignmentType.CENTER, spacing: { after: 60 } }),
        p([r('Good morning! My name is Bianca Ramos. I am an '), r('administrative assistant', { bold: true }),
           r(' at Silva & Costa Ltd., a small '), r('import company', { bold: true }),
           r(' in Curitiba. I work from 8:00 a.m. to 5:30 p.m., from Monday to Friday.')], { alignment: AlignmentType.JUSTIFIED }),
        p([r('My day always starts in the same way. I '), r('arrive', { bold: true }),
           r(' at the office at ten to eight, I turn on the computer and I '), r('check', { bold: true }),
           r(' the e-mails. At 8:15 I print the '), r('schedule', { bold: true }), r(' for my '),
           r('manager', { bold: true }), r(', Mr. Duarte. He usually arrives at half past eight and says: "Good morning, Bianca. How are you today?"')],
          { alignment: AlignmentType.JUSTIFIED }),
        p([r('The telephone '), r('rings', { bold: true }),
           r(' a lot in the morning. When I answer, I say: "Good morning, Silva & Costa, Bianca speaking. How may I help you?" Sometimes the '),
           r('caller', { bold: true }), r(' wants to talk to a '), r('colleague', { bold: true }),
           r(' who is not at the '), r('desk', { bold: true }), r('. Then I say: "I\'m sorry, he isn\'t '),
           r('available', { bold: true }), r(' at the moment. Would you like to '), r('leave a message', { bold: true }), r('?"')],
          { alignment: AlignmentType.JUSTIFIED }),
        p([r('I do not '), r('take care of', { bold: true }), r(' the money. The '), r('finance team', { bold: true }),
           r(' does that. But I must organize the '), r('files', { bold: true }), r(', and I have to '),
           r('confirm', { bold: true }), r(' every meeting one day before.')], { alignment: AlignmentType.JUSTIFIED }),
        p([r('Yesterday was a '), r('busy', { bold: true }), r(' day. A client called at 9:40 a.m. and asked about an '),
           r('order', { bold: true }), r('. The order did not arrive on time because the '), r('supplier', { bold: true }),
           r(' changed the '), r('delivery date', { bold: true }),
           r('. I checked the system, I sent an e-mail to the supplier and I '), r('called', { bold: true }),
           r(' her '), r('back', { bold: true }), r(' at 11:00. She was '), r('angry', { bold: true }),
           r(', but she '), r('thanked', { bold: true }), r(' me at the end of the call.')], { alignment: AlignmentType.JUSTIFIED }),
        p([r('I like my job. It can be '), r('stressful', { bold: true }), r(', but you should always be '),
           r('polite', { bold: true }), r(' and organized. Tomorrow I will start again at 8 o\'clock.')],
          { alignment: AlignmentType.JUSTIFIED })
      ]),

      q('1.', 'Qual é a profissão de Bianca e em que tipo de empresa ela trabalha? (responda em português)'),
      ...blank(2),

      q('2.', 'A que horas Bianca chega ao escritório?'),
      p('(   ) a) At 8:00 a.m.        (   ) b) At 7:50 a.m.        (   ) c) At 8:15 a.m.        (   ) d) At 8:30 a.m.'),

      q('3.', [r('Escreva '), r('T', { bold: true }), r(' (true) ou '), r('F', { bold: true }),
               r(' (false) e '), r('copie do texto', { bold: true }), r(' o trecho em inglês que justifica a resposta.')]),
      p('a) (    ) Bianca é responsável pelo dinheiro da empresa.'),
      p('Justificativa: ' + L(88)),
      p('b) (    ) O pedido atrasou por causa do fornecedor.'),
      p('Justificativa: ' + L(88)),

      q('4.', 'Copie do texto a frase completa que Bianca usa ao atender o telefone.'),
      ...blank(1),

      q('5.', 'Por que a cliente ficou irritada e o que aconteceu no final do telefonema? (em português)'),
      ...blank(2),

      q('6.', [r('Marque '), r('as duas', { bold: true }), r(' tarefas que, segundo o texto, são responsabilidade de Bianca.')]),
      twoCol(
        ['(   ) a) Organizar os arquivos.', '(   ) b) Pagar os fornecedores.', '(   ) c) Confirmar as reuniões com um dia de antecedência.'],
        ['(   ) d) Contratar novos funcionários.', '(   ) e) Fechar o balanço financeiro.']
      ),

      heading('Bloco 2 — Gramática e uso da língua'),

      sub('7. Greetings — cumprimentos'),
      p('Escreva nos parênteses a letra da expressão adequada a cada situação.'),
      new Table({
        columnWidths: [W * 0.55, W * 0.45], width: { size: W, type: WidthType.DXA }, borders: boxBorders,
        rows: [new TableRow({
          children: [
            cell([
              p('1. Você chega ao escritório às 8h da manhã.  (    )'),
              p('2. Você recebe um cliente às 15h.  (    )'),
              p('3. Você se despede de um colega às 18h.  (    )'),
              p('4. Você é apresentado a um novo fornecedor.  (    )'),
              p('5. Alguém pergunta: "How are you?"  (    )')
            ], W * 0.55),
            cell([
              p('a) Good afternoon.'), p('b) Nice to meet you.'), p('c) Good morning.'),
              p('d) I\'m fine, thank you. And you?'), p('e) Goodbye. See you tomorrow.')
            ], W * 0.45)
          ]
        })]
      }),

      sub('8. Telling the time — que horas são'),
      p([r('Escreva as horas em inglês, por extenso. '), r('Exemplo:', { bold: true }), r(' 3:00 → '), r('It\'s three o\'clock.', { italics: true })]),
      twoCol(
        ['a) 7:00 → It\'s ' + L(28), 'b) 9:15 → It\'s ' + L(28), 'c) 10:30 → It\'s ' + L(27)],
        ['d) 2:45 → It\'s ' + L(28), 'e) 5:20 → It\'s ' + L(28), 'f) 12:00 (meio-dia) → It\'s ' + L(19)]
      ),
      p('g) "What time does the meeting start?" — "It starts at ' + L(18) + ' (14h) in the afternoon."'),

      sub('9. Simple Present'),
      p('Complete com a forma correta do verbo entre parênteses.'),
      twoCol(
        ['a) Bianca ' + L(12) + ' (work) at an import company.',
         'b) The employees ' + L(11) + ' (arrive) at eight o\'clock.',
         'c) Mr. Duarte ' + L(12) + ' (have) a meeting every Monday.'],
        ['d) We ' + L(13) + ' (send) invoices by e-mail.',
         'e) The company ' + L(12) + ' (not / open) on Saturdays.',
         'f) My colleague ' + L(11) + ' (study) English on Tuesdays.']
      ),
      tip('Atenção: com he, she, it o verbo muda no presente simples.'),

      sub('10. Simple Past'),
      p('Complete com o passado simples do verbo entre parênteses.'),
      twoCol(
        ['a) Yesterday I ' + L(12) + ' (check) the schedule.',
         'b) The client ' + L(12) + ' (call) at 9:40 a.m.',
         'c) We ' + L(13) + ' (send) the report last Friday.'],
        ['d) The supplier ' + L(11) + ' (change) the delivery date.',
         'e) She ' + L(9) + ' (be) angry, but she ' + L(9) + ' (thank) me.',
         'f) They ' + L(13) + ' (not / receive) the order on time.']
      ),

      sub('11. Modal verbs'),
      p([r('Complete com '), r('can · can\'t · must · should · may', { bold: true }), r('. Use cada palavra pelo menos uma vez.')]),
      twoCol(
        ['a) You ' + L(9) + ' speak English to talk to international clients. (obrigação)',
         'b) "' + L(9) + ' I help you?" (oferta formal ao telefone)',
         'c) He ' + L(9) + ' use the printer on the second floor. (permissão / habilidade)'],
        ['d) You ' + L(9) + ' arrive on time for meetings. (conselho)',
         'e) I\'m sorry, I ' + L(9) + ' answer now; I\'m in a meeting. (impossibilidade)',
         'f) Traduza: "You must confirm the meeting." ' + L(16)]
      ),

      sub('12. O auxiliar DO / DOES / DID'),
      p([r('Complete com '), r('do · does · did · don\'t · doesn\'t · didn\'t', { bold: true }), r('.')]),
      twoCol(
        ['a) ' + L(10) + ' you work on Saturdays?',
         'b) She ' + L(10) + ' answer the phone in the morning. (negativa)',
         'c) ' + L(10) + ' the client call yesterday?'],
        ['d) They ' + L(10) + ' send the invoice last week. (negativa)',
         'e) "' + L(8) + ' Mr. Duarte speak Spanish?" — "Yes, he ' + L(8) + '."',
         'f) I ' + L(10) + ' know the new password. (negativa)']
      ),

      sub('13. Frases negativas e interrogativas'),
      p([r('Reescreva cada frase na forma negativa e na forma interrogativa. '), r('Exemplo:', { bold: true }),
         r(' She works here. → '), r('She doesn\'t work here. / Does she work here?', { italics: true })]),
      p('a) Bianca works from Monday to Friday.'),
      p('Neg.: ' + L(42) + '   Int.: ' + L(42)),
      p('b) The supplier changed the delivery date.'),
      p('Neg.: ' + L(42) + '   Int.: ' + L(42)),
      p('c) She is available at the moment.'),
      p('Neg.: ' + L(42) + '   Int.: ' + L(42)),
      p('d) I can transfer your call.'),
      p('Neg.: ' + L(42) + '   Int.: ' + L(42)),
      tip('Cuidado: os verbos to be (am/is/are/was/were) e os modais (can, must, should, may) não usam o auxiliar do/does/did.'),

      heading('Bloco 3 — Conversas ao telefone'),

      sub('14. Complete os diálogos'),
      p([r('Use as palavras do quadro. Há '), r('duas palavras a mais', { bold: true }), r(' que não serão usadas.')]),
      new Table({
        columnWidths: [W], width: { size: W, type: WidthType.DXA }, borders: boxBorders,
        rows: [new TableRow({
          children: [cell(new Paragraph({
            children: [r('speaking · help · hold · message · call back · wrong · calling · available · busy', { bold: true })],
            alignment: AlignmentType.CENTER, spacing: { after: 0 }
          }), W, { shading: { type: ShadingType.CLEAR, color: 'auto', fill: 'F2F2F2' } })]
        })]
      }),
      p([r('Diálogo A — na recepção da Silva & Costa', { italics: true })]),
      dial('Receptionist:', 'Good afternoon, Silva & Costa. Marina ' + L(12) + ' (1). How may I ' + L(12) + ' (2) you?'),
      dial('Caller:', 'Good afternoon. This is Paulo Menezes, from Trans Log. Could I talk to Mr. Duarte, please?'),
      dial('Receptionist:', 'Just a moment, please. ' + L(12) + ' (3) on… I\'m sorry, he is in a meeting. Would you like to leave a ' + L(12) + ' (4)?'),
      dial('Caller:', 'Yes, please. Could you ask him to ' + L(12) + ' (5) me this afternoon? My number is (41) 99876-5432.'),
      dial('Receptionist:', 'Of course, Mr. Menezes. I will give him the message.'),
      p([r('Diálogo B — engano', { italics: true })]),
      dial('A:', 'Hello?'),
      dial('B:', 'Good morning. Is this the sales department?'),
      dial('A:', 'No, I\'m sorry. You have the ' + L(12) + ' (6) number.'),
      dial('B:', 'Oh, I\'m sorry. Who is ' + L(12) + ' (7), please? … Never mind. Have a nice day.'),

      sub('15. Coloque o diálogo em ordem'),
      p([r('Numere de '), r('1 a 6', { bold: true }), r(' as falas de um telefonema completo.')]),
      twoCol(
        ['(    ) This is Ana Lima, from Vega Store.',
         '(    ) Good morning, Almeida Logistics. Carlos speaking. How may I help you?',
         '(    ) One moment, please. I will transfer your call.'],
        ['(    ) Good morning. Could I speak to Mrs. Souza, please?',
         '(    ) Thank you very much.',
         '(    ) Certainly. May I ask who is calling?']
      ),

      sub('16. Produção escrita'),
      p([r('Você atende o telefone da empresa. Escreva '), r('três falas em inglês', { bold: true }),
         r(', na ordem. Frases curtas e simples são suficientes.')]),
      p('a) Atenda: cumprimente (é de manhã), diga o nome da empresa e o seu nome, e pergunte como pode ajudar.'),
      ...blank(2),
      p('b) O cliente pede para falar com a Sra. Lima, que não está disponível. Informe isso educadamente.'),
      ...blank(2),
      p('c) Ofereça anotar um recado.'),
      ...blank(2),

      heading('Autoavaliação — não vale ponto'),
      (() => {
        const cw = [2000, 1150, 1150, 800, 2250, 1150, 1150, 800];
        const head = ['Assunto', 'Tranquilo', 'Mais ou menos', 'Difícil', 'Assunto', 'Tranquilo', 'Mais ou menos', 'Difícil'];
        const rows = [
          ['Entender o texto', 'Simple past'],
          ['Cumprimentos', 'Verbos modais'],
          ['Dizer as horas', 'Auxiliar do/does/did'],
          ['Simple present', 'Negativa e interrogativa'],
          ['Falar ao telefone', 'Estudou inglês antes: (  ) nunca  (  ) <1 ano  (  ) 1–3 anos  (  ) >3 anos']
        ];
        return new Table({
          columnWidths: cw, width: { size: W, type: WidthType.DXA }, borders: boxBorders,
          rows: [
            new TableRow({
              children: head.map((h, i) => cell(new Paragraph({
                children: [r(h, { bold: true, size: 18 })], alignment: i === 0 || i === 4 ? AlignmentType.LEFT : AlignmentType.CENTER,
                spacing: { after: 0 }
              }), cw[i], { shading: { type: ShadingType.CLEAR, color: 'auto', fill: 'ECECEC' } }))
            }),
            ...rows.map(([a, b], idx) => new TableRow({
              children: idx === 4
                ? [cell(p([r(a, { size: 18 })]), cw[0]), cell(p(''), cw[1]), cell(p(''), cw[2]), cell(p(''), cw[3]),
                   cell(p([r(b, { size: 18 })]), cw[4] + cw[5] + cw[6] + cw[7], { columnSpan: 4 })]
                : [cell(p([r(a, { size: 18 })]), cw[0]), cell(p(''), cw[1]), cell(p(''), cw[2]), cell(p(''), cw[3]),
                   cell(p([r(b, { size: 18 })]), cw[4]), cell(p(''), cw[5]), cell(p(''), cw[6]), cell(p(''), cw[7])]
            }))
          ]
        });
      })(),

      new Paragraph({ children: [new PageBreak()] }),

      new Paragraph({
        children: [r('ANEXO — GLOSSÁRIO', { bold: true, size: 27 })],
        alignment: AlignmentType.CENTER, spacing: { after: 40 }
      }),
      new Paragraph({
        children: [r('Folha de apoio · pode ser consultada durante toda a atividade · pode ser destacada', { size: 19, italics: true })],
        alignment: AlignmentType.CENTER, spacing: { after: 140 }
      }),

      (() => {
        const pairs = [
          ['administrative assistant', 'assistente administrativo(a)'], ['import company', 'empresa importadora'],
          ['to arrive', 'chegar'], ['to check', 'conferir, verificar'],
          ['schedule', 'agenda, cronograma'], ['manager', 'gerente'],
          ['to ring (rings)', 'tocar (o telefone toca)'], ['caller', 'pessoa que está ligando'],
          ['colleague', 'colega de trabalho'], ['desk', 'mesa de trabalho'],
          ['available', 'disponível'], ['to leave a message', 'deixar um recado'],
          ['to take care of', 'cuidar de, ser responsável por'], ['finance team', 'equipe financeira'],
          ['files', 'arquivos, documentos'], ['to confirm', 'confirmar'],
          ['busy', 'corrido, ocupado'], ['order', 'pedido'],
          ['supplier', 'fornecedor'], ['delivery date', 'data de entrega'],
          ['on time', 'no prazo, na hora certa'], ['to call back', 'retornar a ligação'],
          ['angry', 'irritado(a), com raiva'], ['to thank', 'agradecer'],
          ['polite', 'educado(a), cortês'], ['stressful', 'estressante']
        ];
        const cw = [1700, 3625, 1700, 3625];
        const rows = [];
        rows.push(new TableRow({
          children: [cell(new Paragraph({ children: [r('Palavras do texto "A Day at the Office"', { bold: true, size: 18 })], spacing: { after: 0 } }),
            W, { columnSpan: 4, shading: { type: ShadingType.CLEAR, color: 'auto', fill: 'ECECEC' } })]
        }));
        for (let i = 0; i < pairs.length; i += 2) {
          const a = pairs[i], b = pairs[i + 1] || ['', ''];
          rows.push(new TableRow({
            children: [
              cell(p([r(a[0], { size: 18 })]), cw[0]), cell(p([r(a[1], { size: 18 })]), cw[1]),
              cell(p([r(b[0], { size: 18 })]), cw[2]), cell(p([r(b[1], { size: 18 })]), cw[3])
            ]
          }));
        }
        return new Table({ columnWidths: cw, width: { size: W, type: WidthType.DXA }, borders: boxBorders, rows });
      })(),

      new Paragraph({ children: [r('')], spacing: { after: 100 } }),

      (() => {
        const pairs = [
          ['employee', 'funcionário(a)'], ['invoice', 'nota fiscal, fatura'],
          ['report', 'relatório'], ['meeting', 'reunião'],
          ['to send', 'enviar'], ['to transfer a call', 'transferir uma ligação'],
          ['sales department', 'departamento de vendas'], ['wrong number', 'número errado'],
          ['hold on', 'aguarde na linha'], ['speaking', 'falando (ao telefone: "é o próprio")'],
          ['Never mind.', 'Deixa pra lá.'], ['You\'re welcome.', 'De nada.']
        ];
        const cw = [1700, 3625, 1700, 3625];
        const rows = [new TableRow({
          children: [cell(new Paragraph({ children: [r('Palavras dos exercícios', { bold: true, size: 18 })], spacing: { after: 0 } }),
            W, { columnSpan: 4, shading: { type: ShadingType.CLEAR, color: 'auto', fill: 'ECECEC' } })]
        })];
        for (let i = 0; i < pairs.length; i += 2) {
          const a = pairs[i], b = pairs[i + 1] || ['', ''];
          rows.push(new TableRow({
            children: [
              cell(p([r(a[0], { size: 18 })]), cw[0]), cell(p([r(a[1], { size: 18 })]), cw[1]),
              cell(p([r(b[0], { size: 18 })]), cw[2]), cell(p([r(b[1], { size: 18 })]), cw[3])
            ]
          }));
        }
        return new Table({ columnWidths: cw, width: { size: W, type: WidthType.DXA }, borders: boxBorders, rows });
      })(),

      new Paragraph({ children: [r('')], spacing: { after: 100 } }),

      (() => {
        const pairs = [
          ['4:00', 'It\'s four o\'clock.'], ['4:15', 'It\'s a quarter past four. (four fifteen)'],
          ['4:30', 'It\'s half past four. (four thirty)'], ['4:45', 'It\'s a quarter to five. (four forty-five)'],
          ['4:10', 'It\'s ten past four.'], ['4:50', 'It\'s ten to five.'],
          ['12:00', 'It\'s twelve o\'clock. / It\'s midday (noon).'], ['a.m. / p.m.', 'antes do meio-dia / depois do meio-dia'],
          ['manhã / tarde / noite', 'in the morning / in the afternoon / in the evening']
        ];
        const cw = [1700, 3625, 1700, 3625];
        const rows = [new TableRow({
          children: [cell(new Paragraph({ children: [r('Como dizer as horas — modelo rápido', { bold: true, size: 18 })], spacing: { after: 0 } }),
            W, { columnSpan: 4, shading: { type: ShadingType.CLEAR, color: 'auto', fill: 'ECECEC' } })]
        })];
        for (let i = 0; i < pairs.length; i += 2) {
          const a = pairs[i], b = pairs[i + 1] || ['', ''];
          rows.push(new TableRow({
            children: [
              cell(p([r(a[0], { size: 18 })]), cw[0]), cell(p([r(a[1], { size: 18 })]), cw[1]),
              cell(p([r(b[0], { size: 18 })]), cw[2]), cell(p([r(b[1], { size: 18 })]), cw[3])
            ]
          }));
        }
        return new Table({ columnWidths: cw, width: { size: W, type: WidthType.DXA }, borders: boxBorders, rows });
      })(),

      new Paragraph({
        children: [r('Bom trabalho! — Have a nice class.', { italics: true, size: 19 })],
        alignment: AlignmentType.CENTER, spacing: { before: 160 }
      })
    ]
  }]
});

Packer.toBuffer(doc).then(buf => {
  fs.writeFileSync(process.argv[2], buf);
  console.log('gerado:', process.argv[2], (buf.length / 1024).toFixed(0) + ' KB');
});
