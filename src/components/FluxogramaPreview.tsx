import { useEffect, useMemo, useRef } from 'react';
import mermaid from 'mermaid';
import { esc } from '../core/esc';
import { sanitizeSvg } from '../core/sanitizeSvg';

interface Props {
  code: string;
  titulo: string;
  versao?: string;
  unidade?: string;
}

let mermaidIdCounter = 0;

mermaid.initialize({
  startOnLoad: false,
  theme: 'base',
  securityLevel: 'strict',
  themeVariables: {
    fontFamily: "'Segoe UI', Arial, sans-serif",
    primaryColor: '#eaf1fb',
    primaryBorderColor: '#1351B4',
    primaryTextColor: '#1a2433',
    lineColor: '#5a6b8c',
    tertiaryColor: '#f4f8ff',
  },
  flowchart: {
    useMaxWidth: true,
    htmlLabels: true, // quebra de linha só em espaços (sem cortar palavras)
    curve: 'basis',
    wrappingWidth: 220,
    padding: 12,
  },
});

export default function FluxogramaPreview({ code, titulo, versao = '1.0', unidade }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const dataAtual = useMemo(() => new Date().toLocaleDateString('pt-BR'), []);

  useEffect(() => {
    if (!code || !ref.current) return;
    let cancelled = false;
    const renderId = `mermaid-${++mermaidIdCounter}`;
    mermaid
      .render(renderId, code)
      .then(({ svg }) => {
        if (cancelled || !ref.current) return;
        ref.current.innerHTML = sanitizeSvg(svg);
      })
      .catch(() => {
        if (ref.current) ref.current.textContent = 'Não foi possível renderizar o fluxograma.';
      });
    return () => {
      cancelled = true;
    };
  }, [code]);

  const exportarPdf = () => {
    const svgEl = ref.current?.querySelector('svg');
    if (!svgEl) return;
    const svgMarkup = new XMLSerializer().serializeToString(svgEl);
    const win = window.open('', '_blank', 'width=900,height=1200');
    if (!win) return;
    win.document.write(`<!DOCTYPE html><html lang="pt-BR"><head><meta charset="utf-8">
      <title>${esc(titulo || 'Fluxograma')}</title>
      <style>
        @page { size: A4 portrait; margin: 16mm; }
        * { box-sizing: border-box; }
        body { margin: 0; font-family: 'Segoe UI', Arial, sans-serif; color: #1a1a2e; }
        .doc-header { text-align: center; border-bottom: 2px solid #1351B4; padding-bottom: 12px; margin-bottom: 28px; }
        .doc-header h1 { font-size: 20px; margin: 0 0 6px; color: #1351B4; }
        .doc-header .meta { font-size: 12px; color: #555; display: flex; gap: 18px; justify-content: center; flex-wrap: wrap; }
        .diagram { display: flex; justify-content: center; }
        .diagram svg { max-width: 100%; height: auto; }
      </style></head>
      <body>
        <header class="doc-header">
          <h1>${esc(titulo || 'Fluxograma de Processo')}</h1>
          <div class="meta">
            ${unidade ? `<span>Unidade: ${esc(unidade)}</span>` : ''}
            <span>Versão: ${esc(versao)}</span>
            <span>Data: ${esc(dataAtual)}</span>
          </div>
        </header>
        <div class="diagram">${svgMarkup}</div>
      </body></html>`);
    win.document.close();
    win.onafterprint = () => win.close();
    setTimeout(() => {
      win.focus();
      win.print();
    }, 400);
  };

  const baixarSvg = () => {
    const svgEl = ref.current?.querySelector('svg');
    if (!svgEl) return;
    const blob = new Blob([new XMLSerializer().serializeToString(svgEl)], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${(titulo || 'fluxograma').replace(/\s+/g, '_')}.svg`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="preview">
      <div className="preview__diagram" ref={ref} />
      <div className="preview__actions">
        <button className="btn btn--primary" onClick={exportarPdf} disabled={!code}>
          Exportar PDF
        </button>
        <button className="btn" onClick={baixarSvg} disabled={!code}>
          Baixar SVG
        </button>
      </div>
    </div>
  );
}
