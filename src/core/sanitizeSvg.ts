import DOMPurify from 'dompurify';

// Sanitiza o SVG do Mermaid antes de injetar no DOM.
// HTML_INTEGRATION_POINTS:{foreignobject} preserva os rótulos HTML dos nós
// (Mermaid 11, htmlLabels:true) SEM desativar a remoção de scripts/handlers —
// é a mesma config que o Mermaid usa internamente em securityLevel:'strict'.
export function sanitizeSvg(svg: string): string {
  return DOMPurify.sanitize(svg, {
    USE_PROFILES: { svg: true, svgFilters: true },
    ADD_TAGS: ['style', 'foreignObject'],
    HTML_INTEGRATION_POINTS: { foreignobject: true },
  } as Parameters<typeof DOMPurify.sanitize>[1]);
}
