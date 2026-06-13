// Gera código Mermaid a partir da topologia explícita do conversor.
// Porte de FlowchartAgent._gerar_mermaid_explicito (MapaGov).

import type { Fluxograma } from './types';

/** Neutraliza caracteres que quebram a sintaxe Mermaid / HTML. */
function sanitize(text: string): string {
  let t = String(text ?? '');
  t = t.replace(/"/g, "'").replace(/\[/g, '(').replace(/\]/g, ')');
  t = t
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/`/g, "'");
  return t;
}

/** Sanitiza e remove o que quebra rótulos de aresta / losangos. */
function rotuloSeguro(text: string): string {
  return sanitize(text).replace(/\|/g, '/').replace(/\{/g, '(').replace(/\}/g, ')');
}

export function gerarMermaid(fluxo: Fluxograma, nomeProcesso = 'Processo'): string {
  const { etapas, decisoes } = fluxo;
  const nome = sanitize(nomeProcesso);

  if (etapas.length === 0 && decisoes.length === 0) {
    return 'graph TD\n    inicio([Início]) --> fim([Fim])';
  }

  const lines: string[] = ['graph TD', `    inicio([Início: ${nome}])`];

  for (const e of etapas) {
    lines.push(`    e${e.id}["${e.id}. ${sanitize(e.texto)}"]`);
  }
  for (const d of decisoes) {
    lines.push(`    d${d.id}{{${rotuloSeguro(d.condicao)}}}`);
  }
  lines.push('    fim([Fim])');
  lines.push('');

  const entrada = fluxo.entrada || (etapas.length ? `e${etapas[0].id}` : `d${decisoes[0].id}`);
  lines.push(`    inicio --> ${entrada}`);

  for (const e of etapas) {
    lines.push(`    e${e.id} --> ${e.proxima || 'fim'}`);
  }
  for (const d of decisoes) {
    for (const ramo of d.ramos) {
      const destino = ramo.destino || 'fim';
      const rotulo = rotuloSeguro(ramo.rotulo);
      lines.push(rotulo ? `    d${d.id} -->|${rotulo}| ${destino}` : `    d${d.id} --> ${destino}`);
    }
  }

  return lines.join('\n');
}
