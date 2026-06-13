// @vitest-environment jsdom
import { describe, it, expect } from 'vitest';
import { sanitizeSvg } from './sanitizeSvg';

describe('sanitizeSvg', () => {
  it('preserva o texto do rótulo dentro do foreignObject', () => {
    const svg =
      '<svg xmlns="http://www.w3.org/2000/svg"><g class="node"><foreignObject width="100" height="20">' +
      '<div xmlns="http://www.w3.org/1999/xhtml"><span class="nodeLabel">Receber demanda</span></div>' +
      '</foreignObject></g></svg>';
    const limpo = sanitizeSvg(svg);
    expect(limpo).toContain('Receber demanda');
    expect(limpo.toLowerCase()).toContain('foreignobject');
  });

  it('remove handlers e tags perigosas (XSS) mesmo dentro do foreignObject', () => {
    const svg =
      '<svg xmlns="http://www.w3.org/2000/svg"><foreignObject>' +
      '<div xmlns="http://www.w3.org/1999/xhtml">' +
      '<span>ok<img src=x onerror=alert(1)></span><script>alert(2)</script>' +
      '</div></foreignObject></svg>';
    const limpo = sanitizeSvg(svg).toLowerCase();
    expect(limpo).not.toContain('onerror');
    expect(limpo).not.toContain('<img');
    expect(limpo).not.toContain('<script');
    expect(limpo).toContain('ok');
  });

  it('remove javascript: em href de link SVG', () => {
    const svg =
      '<svg xmlns="http://www.w3.org/2000/svg"><a href="javascript:alert(1)"><text>x</text></a></svg>';
    const limpo = sanitizeSvg(svg).toLowerCase();
    expect(limpo).not.toContain('javascript:');
  });
});
