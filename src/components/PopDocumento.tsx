import { useMemo } from 'react';
import type { Pop } from '../core/types';
import { popDocumentoHtml, POP_DOC_CSS } from '../core/popDocumentoHtml';
import { esc } from '../core/esc';
import { exportarPopJson, nomeArquivo } from '../core/popIo';

interface Props {
  pop: Pop;
}

export default function PopDocumento({ pop }: Props) {
  const html = useMemo(() => popDocumentoHtml(pop), [pop]);

  const exportarPdf = () => {
    const win = window.open('', '_blank', 'width=900,height=1200');
    if (!win) return;
    win.opener = null; // corta o vínculo opener (defesa em profundidade)
    win.document.write(`<!DOCTYPE html><html lang="pt-BR"><head><meta charset="utf-8">
      <title>${esc(pop.nomeProcesso || 'POP')}</title>
      <style>
        @page { size: A4 portrait; margin: 20mm; }
        * { box-sizing: border-box; }
        body { margin: 0; }
        ${POP_DOC_CSS}
      </style></head>
      <body><div class="pop-doc">${html}</div></body></html>`);
    win.document.close();
    win.onafterprint = () => win.close();
    setTimeout(() => {
      win.focus();
      win.print();
    }, 300);
  };

  const baixarEditavel = () => {
    const blob = new Blob([exportarPopJson(pop)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = nomeArquivo(pop);
    a.click();
    URL.revokeObjectURL(url);
  };

  // Um clique: avisa, baixa o arquivo editável (revisável) E abre o PDF.
  const exportarDocumentos = () => {
    const ok = window.confirm(
      'Vão baixar DOIS arquivos — salve os dois:\n\n' +
        '• PDF do POP — o documento final, para imprimir/compartilhar.\n' +
        '• Arquivo editável — para revisar ou alterar o POP depois.\n\n' +
        'Para editar este POP no futuro, abra o arquivo com este nome:\n' +
        `"${nomeArquivo(pop)}"\n\n` +
        'Continuar?',
    );
    if (!ok) return;
    baixarEditavel();
    exportarPdf();
  };

  return (
    <div className="documento">
      <div className="documento__actions">
        <button className="btn btn--primary" onClick={exportarDocumentos}>
          Exportar documentos POP
        </button>
      </div>
      <p className="dica">
        Baixa <strong>dois arquivos</strong>: o PDF do POP <em>e</em> o arquivo editável (para revisar depois).
      </p>
      <style>{POP_DOC_CSS}</style>
      <div className="pop-doc documento__folha" dangerouslySetInnerHTML={{ __html: html }} />
    </div>
  );
}
