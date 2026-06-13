import { useMemo } from 'react';
import type { Pop } from '../core/types';
import { popDocumentoHtml, POP_DOC_CSS } from '../core/popDocumentoHtml';
import { esc } from '../core/esc';

interface Props {
  pop: Pop;
}

export default function PopDocumento({ pop }: Props) {
  const html = useMemo(() => popDocumentoHtml(pop), [pop]);

  const exportarPdf = () => {
    const win = window.open('', '_blank', 'width=900,height=1200');
    if (!win) return;
    win.document.write(`<!DOCTYPE html><html lang="pt-BR"><head><meta charset="utf-8">
      <title>${esc(pop.nomeProcesso || 'POP')}</title>
      <style>
        @page { size: A4 portrait; margin: 16mm; }
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

  return (
    <div className="documento">
      <div className="documento__actions">
        <button className="btn btn--primary" onClick={exportarPdf}>
          Exportar PDF
        </button>
      </div>
      <style>{POP_DOC_CSS}</style>
      <div className="pop-doc documento__folha" dangerouslySetInnerHTML={{ __html: html }} />
    </div>
  );
}
