// Modelo de dados do POP (Procedimento Operacional Padrão).
// Espelha a estrutura do documento: identificação + 7 seções.

export interface Subetapa {
  descricao: string;
}

export interface Cenario {
  /** Rótulo do caminho da decisão. Ex.: "Sim", "Não", "Férias". */
  descricao: string;
  subetapas: Subetapa[];
}

export type TipoEtapa = 'normal' | 'condicional';

export interface Etapa {
  id: string;
  tipo: TipoEtapa;
  /** Ação da etapa (normal) ou pergunta da decisão (condicional). */
  acaoPrincipal: string;
  operador?: string;
  sistemas?: string[];
  docsRequeridos?: string[];
  docsGerados?: string[];
  verificacoes?: string[];
  /** Apenas quando tipo === 'condicional'. */
  cenarios?: Cenario[];
}

export interface DocumentoPop {
  tipo?: string;
  descricao: string;
  uso?: string;
  obrigatorio?: boolean;
  sistema?: string;
}

export interface Pop {
  // Identificação
  nomeProcesso: string;
  unidade?: string;
  area?: string;
  codigo?: string;
  versao: string;
  macroprocesso?: string;
  processoEspecifico?: string;
  subprocesso?: string;
  /** Tempo estimado do PROCESSO inteiro (uma vez, não por etapa). */
  tempoEstimado?: string;
  // Seções
  entregaEsperada?: string;          // 1
  dispositivosNormativos?: string;   // 2
  sistemasUtilizados?: string[];     // 3
  operadores?: string;               // 4
  etapas: Etapa[];                   // 5
  documentos?: DocumentoPop[];       // 6
  pontosAtencao?: string;            // 7
}

export function popVazio(): Pop {
  return {
    nomeProcesso: '',
    versao: '1.0',
    sistemasUtilizados: [],
    etapas: [],
    documentos: [],
  };
}

// --- Saída do conversor de fluxograma (extra) ---

export interface RamoDecisao {
  rotulo: string;
  destino: string; // "e<id>" | "d<id>" | "fim"
}

export interface NoFluxo {
  id: number;
  texto: string;
  proxima: string; // "e<id>" | "d<id>" | "fim"
}

export interface DecisaoFluxo {
  id: number;
  condicao: string;
  ramos: RamoDecisao[];
}

export interface Fluxograma {
  entrada: string;
  etapas: NoFluxo[];
  decisoes: DecisaoFluxo[];
  avisos: string[];
}
