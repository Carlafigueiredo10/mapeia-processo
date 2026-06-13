// Escape de HTML único e centralizado (usado no documento, na janela de
// impressão e no fluxograma). Cobre conteúdo de elemento E atributos
// (aspas simples e duplas) — defesa em profundidade contra XSS.

export function esc(s: unknown): string {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
