import { describe, it, expect } from 'vitest';
import { exportarPopJson, importarPopJson, nomeArquivo } from './popIo';
import { popVazio } from './types';
import type { Pop } from './types';

const pop: Pop = {
  ...popVazio(),
  nomeProcesso: 'Concessão de Pensão',
  versao: '2.0',
  sistemasUtilizados: ['SEI'],
  etapas: [{ id: '1', tipo: 'normal', acaoPrincipal: 'Receber' }],
};

describe('popIo', () => {
  it('round-trip export -> import preserva os dados', () => {
    const json = exportarPopJson(pop);
    const lido = importarPopJson(json);
    expect(lido.nomeProcesso).toBe('Concessão de Pensão');
    expect(lido.versao).toBe('2.0');
    expect(lido.etapas).toHaveLength(1);
    expect(lido.sistemasUtilizados).toEqual(['SEI']);
  });

  it('import tolera campos ausentes (mescla com vazio)', () => {
    const lido = importarPopJson('{"nomeProcesso":"X"}');
    expect(lido.nomeProcesso).toBe('X');
    expect(lido.versao).toBe('1.0');
    expect(lido.etapas).toEqual([]);
    expect(lido.documentos).toEqual([]);
  });

  it('import rejeita JSON inválido', () => {
    expect(() => importarPopJson('não é json')).toThrow();
    expect(() => importarPopJson('123')).toThrow('válido');
  });

  it('nomeArquivo remove acentos e normaliza', () => {
    expect(nomeArquivo(pop)).toBe('concessao-de-pensao.json');
    expect(nomeArquivo({ ...pop, nomeProcesso: '' })).toBe('pop.json');
  });

  it('bloqueia prototype pollution via __proto__', () => {
    const malicioso = '{"nomeProcesso":"X","__proto__":{"poluido":true}}';
    const lido = importarPopJson(malicioso);
    expect(lido.nomeProcesso).toBe('X');
    // o protótipo de Object NÃO foi poluído
    expect(({} as Record<string, unknown>).poluido).toBeUndefined();
    expect(Object.prototype.hasOwnProperty.call(Object.prototype, 'poluido')).toBe(false);
  });

  it('coage tipos inesperados sem quebrar (etapas/sistemas malformados)', () => {
    const sujo = JSON.stringify({
      nomeProcesso: 'X',
      sistemasUtilizados: ['SEI', 123, null, 'SAPIENS'], // mistura
      etapas: [
        { tipo: 'normal', acaoPrincipal: 'A', sistemas: 'nao-array' as unknown },
        { tipo: 'condicional', acaoPrincipal: 'Q?', cenarios: 'tambem-nao-array' as unknown },
        'lixo-string',
        42,
      ],
    });
    const lido = importarPopJson(sujo);
    expect(lido.sistemasUtilizados).toEqual(['SEI', 'SAPIENS']); // só strings
    expect(lido.etapas).toHaveLength(4);
    expect(lido.etapas[0].sistemas).toEqual([]); // coagido para array
    expect(lido.etapas[1].cenarios).toEqual([]); // coagido para array
    expect(lido.etapas[2].acaoPrincipal).toBe(''); // string solta vira etapa vazia
    expect(lido.etapas.every((e) => typeof e.id === 'string')).toBe(true);
  });
});
