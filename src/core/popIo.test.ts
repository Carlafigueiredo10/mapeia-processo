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
});
