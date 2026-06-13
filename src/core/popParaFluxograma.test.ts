import { describe, it, expect } from 'vitest';
import { popParaFluxograma } from './popParaFluxograma';
import { gerarMermaid } from './gerarMermaid';
import type { Etapa } from './types';

const normal = (acaoPrincipal: string, operador?: string): Etapa => ({
  id: crypto.randomUUID(),
  tipo: 'normal',
  acaoPrincipal,
  operador,
});

describe('popParaFluxograma', () => {
  it('encadeia etapas normais e termina em fim', () => {
    const r = popParaFluxograma([normal('A', 'Op'), normal('B')]);
    expect(r.entrada).toBe('e1');
    const e1 = r.etapas.find((e) => e.id === 1)!;
    expect(e1.texto).toBe('A (Op)');
    expect(e1.proxima).toBe('e2');
    expect(r.etapas.find((e) => e.id === 2)!.proxima).toBe('fim');
    expect(r.decisoes).toHaveLength(0);
  });

  it('decisão binária gera losango e reconverge', () => {
    const etapas: Etapa[] = [
      normal('Receber'),
      {
        id: 'x',
        tipo: 'condicional',
        acaoPrincipal: 'Aprovado?',
        cenarios: [
          { descricao: 'Sim', subetapas: [{ descricao: 'Pagar' }] },
          { descricao: 'Não', subetapas: [{ descricao: 'Devolver' }] },
        ],
      },
      normal('Arquivar'),
    ];
    const r = popParaFluxograma(etapas);
    expect(r.entrada).toBe('e1');
    expect(r.etapas.find((e) => e.id === 1)!.proxima).toBe('d1');

    const d = r.decisoes[0];
    expect(d.condicao).toBe('Aprovado?');
    expect(new Set(d.ramos.map((x) => x.rotulo))).toEqual(new Set(['Sim', 'Não']));

    const arquivar = r.etapas.find((e) => e.texto === 'Arquivar')!;
    const pagar = r.etapas.find((e) => e.texto === 'Pagar')!;
    const devolver = r.etapas.find((e) => e.texto === 'Devolver')!;
    expect(pagar.proxima).toBe(`e${arquivar.id}`);
    expect(devolver.proxima).toBe(`e${arquivar.id}`);
    expect(arquivar.proxima).toBe('fim');
  });

  it('rótulo curto na seta e "resto" vira nó (sem subetapas)', () => {
    const r = popParaFluxograma([
      {
        id: 'x',
        tipo: 'condicional',
        acaoPrincipal: 'Atende?',
        cenarios: [
          { descricao: 'Sim → prosseguir para conclusão', subetapas: [] },
          { descricao: 'Não → devolver para correção', subetapas: [] },
        ],
      },
      normal('Comunicar'),
    ]);
    expect(new Set(r.decisoes[0].ramos.map((x) => x.rotulo))).toEqual(new Set(['Sim', 'Não']));
    const textos = new Set(r.etapas.map((e) => e.texto));
    expect(textos.has('prosseguir para conclusão')).toBe(true);
    expect(textos.has('devolver para correção')).toBe(true);
  });

  it('múltiplos caminhos', () => {
    const r = popParaFluxograma([
      {
        id: 'x',
        tipo: 'condicional',
        acaoPrincipal: 'Qual tipo?',
        cenarios: [
          { descricao: 'Férias', subetapas: [{ descricao: 'Processo férias' }] },
          { descricao: 'Licença', subetapas: [{ descricao: 'Processo licença' }] },
          { descricao: 'Afastamento', subetapas: [{ descricao: 'Processo afastamento' }] },
        ],
      },
    ]);
    expect(r.entrada).toBe('d1');
    expect(r.decisoes[0].ramos).toHaveLength(3);
    for (const e of r.etapas) expect(e.proxima).toBe('fim');
  });

  it('condicional sem caminhos degrada para nó simples', () => {
    const r = popParaFluxograma([{ id: 'x', tipo: 'condicional', acaoPrincipal: 'Decisão órfã', cenarios: [] }]);
    expect(r.decisoes).toHaveLength(0);
    expect(r.etapas).toHaveLength(1);
  });

  it('lista vazia', () => {
    const r = popParaFluxograma([]);
    expect(r.etapas).toHaveLength(0);
    expect(r.entrada).toBe('fim');
    expect(r.avisos.length).toBeGreaterThan(0);
  });
});

describe('gerarMermaid', () => {
  it('renderiza losango, entrada e reconvergência', () => {
    const r = popParaFluxograma([
      normal('Receber'),
      {
        id: 'x',
        tipo: 'condicional',
        acaoPrincipal: 'Aprovado?',
        cenarios: [
          { descricao: 'Sim', subetapas: [{ descricao: 'Pagar' }] },
          { descricao: 'Não', subetapas: [{ descricao: 'Devolver' }] },
        ],
      },
      normal('Arquivar'),
    ]);
    const m = gerarMermaid(r, 'Processo');
    expect(m).toContain('graph TD');
    expect(m).toContain('d1{{Aprovado?}}');
    expect(m).toContain('inicio --> e1');
    expect(m).toContain('e1 --> d1');
    expect(m).toContain('-->|Sim|');
    expect(m).toContain('-->|Não|');
    const arquivar = r.etapas.find((e) => e.texto === 'Arquivar')!;
    expect((m.match(new RegExp(`--> e${arquivar.id}\\b`, 'g')) || []).length).toBe(2);
  });

  it('sanitiza caracteres perigosos no texto', () => {
    const r = popParaFluxograma([normal('A <script>alert(1)</script>')]);
    const m = gerarMermaid(r);
    expect(m).not.toContain('<script>');
    expect(m).toContain('&lt;script&gt;');
  });
});
