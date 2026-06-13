// Conversor Processo -> Fluxograma (função pura).
//
// Porte do núcleo do MapaGov (pop_para_fluxograma.py) para TypeScript.
// Lê as etapas estruturadas e produz uma topologia EXPLÍCITA com ramificação
// real (losangos N-vias + reconvergência) para etapas condicionais — sem LLM.
//
// Cada nó aponta o próximo via token:
//   "e<id>" -> nó de etapa | "d<id>" -> nó de decisão | "fim" -> terminal

import type { Cenario, Etapa, Fluxograma, NoFluxo, RamoDecisao } from './types';

const SEM_TEXTO = '[Sem descrição]';
const JOIN = '__JOIN__'; // placeholder de reconvergência (resolvido na 2ª passada)

/** Rótulo enxuto para a seta. "Sim → prosseguir..." vira "Sim". */
function rotuloCurto(descricao: string): string {
  const txt = (descricao || '').trim();
  for (const sep of ['→', '->']) {
    if (txt.includes(sep)) {
      return txt.split(sep)[0].trim() || txt;
    }
  }
  return txt;
}

/** Texto após a seta. "Sim → prosseguir..." vira "prosseguir...". */
function restoAposSeta(descricao: string): string {
  const txt = (descricao || '').trim();
  for (const sep of ['→', '->']) {
    if (txt.includes(sep)) {
      return txt.slice(txt.indexOf(sep) + sep.length).trim();
    }
  }
  return '';
}

function textoEtapa(etapa: Etapa): string {
  const base = (etapa.acaoPrincipal || '').trim() || SEM_TEXTO;
  const op = (etapa.operador || '').trim();
  return op ? `${base} (${op})` : base;
}

interface Bloco {
  entrada: string;
  nos: NoFluxo[];
  decisaoId: number | null;
}

export function popParaFluxograma(etapasEntrada: Etapa[]): Fluxograma {
  const etapas = Array.isArray(etapasEntrada) ? etapasEntrada : [];
  const etapasFluxo: NoFluxo[] = [];
  const decisoesFluxo: { id: number; condicao: string; ramos: RamoDecisao[] }[] = [];
  const avisos: string[] = [];

  if (etapas.length === 0) {
    avisos.push('Nenhuma etapa cadastrada — nada a converter.');
    return { entrada: 'fim', etapas: [], decisoes: [], avisos };
  }

  let nextEid = 1;
  let nextDid = 1;
  const blocos: Bloco[] = [];

  etapas.forEach((etapa, idx) => {
    const numero = String(idx + 1);
    const cenariosValidos: Cenario[] =
      etapa.tipo === 'condicional'
        ? (etapa.cenarios || []).filter((c) => c && typeof c.descricao === 'string')
        : [];

    if (etapa.tipo === 'condicional' && cenariosValidos.length > 0) {
      const dId = nextDid++;
      const condicao = (etapa.acaoPrincipal || '').trim() || SEM_TEXTO;
      const ramos: RamoDecisao[] = [];
      const nosBloco: NoFluxo[] = [];

      for (const cenario of cenariosValidos) {
        const desc = (cenario.descricao || '').trim();
        const rotulo = rotuloCurto(desc) || SEM_TEXTO;
        const subs = (cenario.subetapas || []).filter((s) => s && typeof s.descricao === 'string');

        if (subs.length > 0) {
          const primeiroId = nextEid;
          subs.forEach((sub, i) => {
            const subTxt = (sub.descricao || '').trim() || SEM_TEXTO;
            const eid = nextEid++;
            const proxima = i < subs.length - 1 ? `e${nextEid}` : JOIN;
            nosBloco.push({ id: eid, texto: subTxt, proxima });
          });
          ramos.push({ rotulo, destino: `e${primeiroId}` });
        } else {
          const resto = restoAposSeta(desc);
          if (resto) {
            const eid = nextEid++;
            nosBloco.push({ id: eid, texto: resto, proxima: JOIN });
            ramos.push({ rotulo, destino: `e${eid}` });
          } else {
            ramos.push({ rotulo, destino: JOIN });
          }
        }
      }

      decisoesFluxo.push({ id: dId, condicao, ramos });
      blocos.push({ entrada: `d${dId}`, nos: nosBloco, decisaoId: dId });
      avisos.push(`Etapa ${numero}: decisão com ${cenariosValidos.length} caminho(s).`);
    } else {
      if (etapa.tipo === 'condicional') {
        avisos.push(`Etapa ${numero} marcada como decisão mas sem caminhos — tratada como etapa simples.`);
      }
      const eid = nextEid++;
      const nos: NoFluxo[] = [{ id: eid, texto: textoEtapa(etapa), proxima: JOIN }];
      blocos.push({ entrada: `e${eid}`, nos, decisaoId: null });
    }
  });

  // 2ª passada: resolve JOIN -> entrada do próximo bloco (ou "fim" no último).
  blocos.forEach((bloco, i) => {
    const joinToken = i + 1 < blocos.length ? blocos[i + 1].entrada : 'fim';
    for (const no of bloco.nos) {
      if (no.proxima === JOIN) no.proxima = joinToken;
      etapasFluxo.push(no);
    }
    if (bloco.decisaoId !== null) {
      const dec = decisoesFluxo.find((d) => d.id === bloco.decisaoId)!;
      for (const ramo of dec.ramos) {
        if (ramo.destino === JOIN) ramo.destino = joinToken;
      }
    }
  });

  return {
    entrada: blocos[0]?.entrada ?? 'fim',
    etapas: etapasFluxo,
    decisoes: decisoesFluxo,
    avisos,
  };
}
