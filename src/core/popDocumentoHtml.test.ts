import { describe, it, expect } from 'vitest';
import { popDocumentoHtml } from './popDocumentoHtml';
import { popVazio } from './types';
import type { Pop } from './types';

describe('popDocumentoHtml', () => {
  const base = (over: Partial<Pop> = {}): Pop => ({ ...popVazio(), nomeProcesso: 'Teste', ...over });

  it('traz as 7 seções + identificação', () => {
    const html = popDocumentoHtml(base());
    expect(html).toContain('Identificação do Processo');
    expect(html).toContain('1. Entrega esperada');
    expect(html).toContain('2. Dispositivos normativos');
    expect(html).toContain('3. Sistemas utilizados');
    expect(html).toContain('4. Operadores');
    expect(html).toContain('5. Tarefas realizadas');
    expect(html).toContain('6. Documentos');
    expect(html).toContain('7. Pontos gerais de atenção');
  });

  it('renderiza etapa normal com metadados e decisão com caminhos', () => {
    const html = popDocumentoHtml(
      base({
        etapas: [
          { id: '1', tipo: 'normal', acaoPrincipal: 'Receber demanda', operador: 'Analista', sistemas: ['SEI'] },
          {
            id: '2',
            tipo: 'condicional',
            acaoPrincipal: 'Atende?',
            cenarios: [{ descricao: 'Sim', subetapas: [{ descricao: 'Deferir' }] }],
          },
        ],
      }),
    );
    expect(html).toContain('Receber demanda');
    expect(html).toContain('<b>Operador:</b> Analista');
    expect(html).toContain('SEI');
    expect(html).toContain('Atende?');
    expect(html).toContain('Deferir');
    expect(html).toContain('decisão'); // tag
  });

  it('escapa HTML do usuário (XSS)', () => {
    const html = popDocumentoHtml(base({ entregaEsperada: '<img src=x onerror=alert(1)>' }));
    expect(html).not.toContain('<img');
    expect(html).toContain('&lt;img');
  });

  it('mostra placeholders quando vazio', () => {
    const html = popDocumentoHtml(base({ nomeProcesso: 'X' }));
    expect(html).toContain('[Não informado]');
    expect(html).toContain('[Nenhuma etapa mapeada]');
  });
});
