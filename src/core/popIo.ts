// Exportar / importar o POP como arquivo .json (backup e compartilhamento).
// Importação defensiva: bloqueia chaves de protótipo e coage o shape, para que
// um arquivo malformado/hostil não polua protótipo nem quebre o render.

import type { Cenario, DocumentoPop, Etapa, Pop, Subetapa } from './types';
import { popVazio } from './types';

// Limites defensivos: impedem que um .json hostil/gigante trave o render (DoS local).
const MAX_STR = 20_000; // caracteres por campo de texto
const MAX_ETAPAS = 500;
const MAX_CENARIOS = 50;
const MAX_SUBETAPAS = 100;
const MAX_LISTA = 200; // itens em listas (sistemas, docs, etc.)

const str = (v: unknown): string => (typeof v === 'string' ? v.slice(0, MAX_STR) : '');
const strOuUndef = (v: unknown): string | undefined => {
  const s = str(v);
  return s !== '' ? s : undefined;
};
const strArr = (v: unknown): string[] =>
  Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string').slice(0, MAX_LISTA).map((x) => x.slice(0, MAX_STR)) : [];
const obj = (v: unknown): Record<string, unknown> => (v && typeof v === 'object' ? (v as Record<string, unknown>) : {});

let idSeq = 0;
const novoId = (): string => `etapa-import-${idSeq++}`;

function normSubetapa(s: unknown): Subetapa {
  return { descricao: str(obj(s).descricao) };
}

function normCenario(c: unknown): Cenario {
  const o = obj(c);
  return {
    descricao: str(o.descricao),
    subetapas: Array.isArray(o.subetapas) ? o.subetapas.slice(0, MAX_SUBETAPAS).map(normSubetapa) : [],
  };
}

function normEtapa(e: unknown): Etapa {
  const o = obj(e);
  const tipo: Etapa['tipo'] = o.tipo === 'condicional' ? 'condicional' : 'normal';
  const etapa: Etapa = {
    id: typeof o.id === 'string' && o.id ? o.id : novoId(),
    tipo,
    acaoPrincipal: str(o.acaoPrincipal),
    operador: strOuUndef(o.operador),
    sistemas: strArr(o.sistemas),
    docsRequeridos: strArr(o.docsRequeridos),
    docsGerados: strArr(o.docsGerados),
    verificacoes: strArr(o.verificacoes),
    tempoEstimado: strOuUndef(o.tempoEstimado),
  };
  if (tipo === 'condicional') {
    etapa.cenarios = Array.isArray(o.cenarios) ? o.cenarios.slice(0, MAX_CENARIOS).map(normCenario) : [];
  }
  return etapa;
}

function normDoc(d: unknown): DocumentoPop {
  const o = obj(d);
  return {
    descricao: str(o.descricao),
    tipo: strOuUndef(o.tipo),
    uso: strOuUndef(o.uso),
    obrigatorio: o.obrigatorio === true,
    sistema: strOuUndef(o.sistema),
  };
}

/** Coage um objeto arbitrário para um Pop válido (descarta o que não reconhece). */
export function normalizarPop(input: unknown): Pop {
  const o = obj(input);
  const base = popVazio();
  return {
    nomeProcesso: str(o.nomeProcesso),
    unidade: strOuUndef(o.unidade),
    codigo: strOuUndef(o.codigo),
    versao: str(o.versao) || base.versao,
    macroprocesso: strOuUndef(o.macroprocesso),
    processoEspecifico: strOuUndef(o.processoEspecifico),
    subprocesso: strOuUndef(o.subprocesso),
    entregaEsperada: strOuUndef(o.entregaEsperada),
    dispositivosNormativos: strOuUndef(o.dispositivosNormativos),
    sistemasUtilizados: strArr(o.sistemasUtilizados),
    operadores: strOuUndef(o.operadores),
    etapas: Array.isArray(o.etapas) ? o.etapas.slice(0, MAX_ETAPAS).map(normEtapa) : [],
    documentos: Array.isArray(o.documentos) ? o.documentos.slice(0, MAX_LISTA).map(normDoc) : [],
    pontosAtencao: strOuUndef(o.pontosAtencao),
  };
}

/** Reviver que descarta chaves perigosas (anti prototype pollution). */
function reviver(key: string, value: unknown): unknown {
  if (key === '__proto__' || key === 'constructor' || key === 'prototype') return undefined;
  return value;
}

export function parseJsonSeguro(texto: string): unknown {
  return JSON.parse(texto, reviver);
}

export function exportarPopJson(pop: Pop): string {
  return JSON.stringify(pop, null, 2);
}

/** Lê e valida um POP de um texto JSON. Lança Error se o JSON for inválido. */
export function importarPopJson(texto: string): Pop {
  const parsed = parseJsonSeguro(texto);
  if (!parsed || typeof parsed !== 'object') {
    throw new Error('Arquivo não contém um POP válido.');
  }
  return normalizarPop(parsed);
}

/** Nome de arquivo seguro a partir do nome do processo. */
export function nomeArquivo(pop: Pop): string {
  const base = (pop.nomeProcesso || 'pop').trim().toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '') // remove acentos
    .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'pop';
  return `${base}.json`;
}
