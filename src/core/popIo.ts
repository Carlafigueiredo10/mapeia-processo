// Exportar / importar o POP como arquivo .json (backup e compartilhamento).

import type { Pop } from './types';
import { popVazio } from './types';

export function exportarPopJson(pop: Pop): string {
  return JSON.stringify(pop, null, 2);
}

/**
 * Lê um POP de um texto JSON. Tolerante: mescla com o POP vazio para garantir
 * os campos obrigatórios e ignora o que não reconhece. Lança Error se inválido.
 */
export function importarPopJson(texto: string): Pop {
  const obj = JSON.parse(texto);
  if (!obj || typeof obj !== 'object') {
    throw new Error('Arquivo não contém um POP válido.');
  }
  const base = popVazio();
  return {
    ...base,
    ...obj,
    versao: obj.versao || base.versao,
    etapas: Array.isArray(obj.etapas) ? obj.etapas : [],
    sistemasUtilizados: Array.isArray(obj.sistemasUtilizados) ? obj.sistemasUtilizados : [],
    documentos: Array.isArray(obj.documentos) ? obj.documentos : [],
  };
}

/** Nome de arquivo seguro a partir do nome do processo. */
export function nomeArquivo(pop: Pop): string {
  const base = (pop.nomeProcesso || 'pop').trim().toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '') // remove acentos
    .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'pop';
  return `${base}.json`;
}
