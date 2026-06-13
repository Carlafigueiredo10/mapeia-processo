// Gera o documento do POP como HTML (fonte única: preview na tela + PDF).
// Estrutura espelhada do MapaGov: identificação + 7 seções.

import type { Etapa, Pop } from './types';
import { esc } from './esc';

const naoInformado = (v?: string) => (v && v.trim() ? esc(v) : '<i>[Não informado]</i>');
const pendente = (v?: string) => (v && v.trim() ? esc(v) : '<i>[Pendente]</i>');

function listaOuVazio(itens: string[] | undefined, vazio = '[Nenhum item informado]'): string {
  const arr = (itens || []).map((s) => s.trim()).filter(Boolean);
  if (arr.length === 0) return `<p class="vazio">${vazio}</p>`;
  return `<ul>${arr.map((i) => `<li>${esc(i)}</li>`).join('')}</ul>`;
}

function textoOuVazio(v?: string): string {
  return v && v.trim() ? `<p>${esc(v).replace(/\n/g, '<br>')}</p>` : '<p class="vazio">[Não informado]</p>';
}

function etapaHtml(etapa: Etapa, numero: number): string {
  if (etapa.tipo === 'condicional') {
    const cenarios = (etapa.cenarios || []).filter((c) => c && c.descricao?.trim());
    const ramos = cenarios
      .map((c) => {
        const subs = (c.subetapas || []).map((s) => s.descricao?.trim()).filter(Boolean);
        const subsHtml = subs.length ? `<ul>${subs.map((s) => `<li>${esc(s)}</li>`).join('')}</ul>` : '';
        return `<li><b>${esc(c.descricao)}</b>${subsHtml}</li>`;
      })
      .join('');
    return `
      <div class="etapa etapa--decisao">
        <div class="etapa__titulo">${numero}. ${esc(etapa.acaoPrincipal || '[Decisão]')} <span class="tag">decisão</span></div>
        <ul class="cenarios">${ramos}</ul>
      </div>`;
  }

  const meta: string[] = [];
  if (etapa.operador?.trim()) meta.push(`<b>Operador:</b> ${esc(etapa.operador)}`);
  if (etapa.sistemas?.length) meta.push(`<b>Sistemas:</b> ${esc(etapa.sistemas.join(', '))}`);
  if (etapa.docsRequeridos?.length) meta.push(`<b>Docs requeridos:</b> ${esc(etapa.docsRequeridos.join(', '))}`);
  if (etapa.docsGerados?.length) meta.push(`<b>Docs gerados:</b> ${esc(etapa.docsGerados.join(', '))}`);
  if (etapa.tempoEstimado?.trim()) meta.push(`<b>Tempo estimado:</b> ${esc(etapa.tempoEstimado)}`);
  const verifs = (etapa.verificacoes || []).map((v) => v.trim()).filter(Boolean);

  return `
    <div class="etapa">
      <div class="etapa__titulo">${numero}. ${esc(etapa.acaoPrincipal || '[Sem descrição]')}</div>
      ${meta.length ? `<div class="etapa__meta">${meta.join('<br>')}</div>` : ''}
      ${verifs.length ? `<div class="etapa__verif"><b>Verificações:</b><ul>${verifs.map((v) => `<li>${esc(v)}</li>`).join('')}</ul></div>` : ''}
    </div>`;
}

function documentosHtml(pop: Pop): string {
  const docs = (pop.documentos || []).filter((d) => d.descricao?.trim());
  if (docs.length === 0) return '<p class="vazio">[Nenhum documento informado]</p>';
  const linhas = docs
    .map(
      (d) => `<tr>
        <td>${esc(d.tipo || '-')}</td>
        <td>${esc(d.descricao)}</td>
        <td>${esc(d.uso || '-')}</td>
        <td>${d.obrigatorio ? 'Sim' : 'Não'}</td>
        <td>${esc(d.sistema || '-')}</td>
      </tr>`,
    )
    .join('');
  return `<table class="docs">
    <thead><tr><th>Tipo</th><th>Descrição</th><th>Uso</th><th>Obrigatório</th><th>Sistema</th></tr></thead>
    <tbody>${linhas}</tbody>
  </table>`;
}

function secao(titulo: string, conteudo: string): string {
  return `<section class="secao"><h2>${esc(titulo)}</h2>${conteudo}</section>`;
}

/** Corpo do documento (sem <html>/<style> — usado no preview e no print). */
export function popDocumentoHtml(pop: Pop): string {
  const etapas = pop.etapas || [];
  const etapasHtml = etapas.length
    ? etapas.map((e, i) => etapaHtml(e, i + 1)).join('')
    : '<p class="vazio">[Nenhuma etapa mapeada]</p>';

  return `
    <header class="doc-header">
      <h1>${esc(pop.nomeProcesso || 'Procedimento Operacional Padrão')}</h1>
      <div class="meta">
        ${pop.unidade ? `<span>Unidade: ${esc(pop.unidade)}</span>` : ''}
        <span>Versão: ${esc(pop.versao || '1.0')}</span>
        <span>Data: ${new Date().toLocaleDateString('pt-BR')}</span>
      </div>
    </header>

    ${secao(
      'Identificação do Processo',
      `<div class="ident">
        <p><b>Código na arquitetura:</b> ${naoInformado(pop.codigo)}</p>
        <p><b>Versão:</b> ${esc(pop.versao || '1.0')}</p>
        <p><b>Macroprocesso:</b> ${naoInformado(pop.macroprocesso)}</p>
        <p><b>Processo:</b> ${naoInformado(pop.processoEspecifico)}</p>
        <p><b>Subprocesso:</b> ${naoInformado(pop.subprocesso)}</p>
        <p><b>Atividade:</b> ${pendente(pop.nomeProcesso)}</p>
      </div>`,
    )}

    ${secao('1. Entrega esperada da atividade', textoOuVazio(pop.entregaEsperada))}
    ${secao('2. Dispositivos normativos aplicáveis', textoOuVazio(pop.dispositivosNormativos))}
    ${secao('3. Sistemas utilizados / acessos necessários', listaOuVazio(pop.sistemasUtilizados))}
    ${secao('4. Operadores da atividade', textoOuVazio(pop.operadores))}
    ${secao('5. Tarefas realizadas na atividade', `<div class="etapas">${etapasHtml}</div>`)}
    ${secao('6. Documentos, formulários e modelos utilizados', documentosHtml(pop))}
    ${secao('7. Pontos gerais de atenção na atividade', textoOuVazio(pop.pontosAtencao))}
  `;
}

/** CSS do documento — compartilhado entre preview e janela de impressão. */
export const POP_DOC_CSS = `
  .pop-doc { font-family: 'Segoe UI', Arial, sans-serif; color: #1a2433; line-height: 1.5; }
  .pop-doc .doc-header { text-align: center; border-bottom: 3px solid #1351B4; padding-bottom: 14px; margin-bottom: 28px; }
  .pop-doc .doc-header h1 { color: #1351B4; font-size: 22px; margin: 0 0 8px; }
  .pop-doc .doc-header .meta { font-size: 12px; color: #555; display: flex; gap: 18px; justify-content: center; flex-wrap: wrap; }
  .pop-doc .secao { margin-bottom: 22px; page-break-inside: avoid; }
  .pop-doc .secao h2 { font-size: 14px; color: #1351B4; border-bottom: 1px solid #d6e0f0; padding-bottom: 5px; margin: 0 0 10px; text-transform: uppercase; letter-spacing: .3px; }
  .pop-doc .ident p { margin: 3px 0; font-size: 13px; }
  .pop-doc p { margin: 4px 0; font-size: 13px; }
  .pop-doc ul { margin: 4px 0; padding-left: 20px; font-size: 13px; }
  .pop-doc .vazio { color: #999; font-style: italic; }
  .pop-doc .etapa { border-left: 3px solid #1351B4; background: #f7faff; padding: 8px 12px; margin-bottom: 10px; page-break-inside: avoid; }
  .pop-doc .etapa--decisao { border-left-color: #e0a500; background: #fffaf0; }
  .pop-doc .etapa__titulo { font-weight: 600; font-size: 13px; }
  .pop-doc .etapa__meta { font-size: 12px; color: #444; margin-top: 5px; }
  .pop-doc .etapa__verif { font-size: 12px; margin-top: 5px; }
  .pop-doc .tag { font-size: 10px; background: #e0a500; color: #fff; padding: 1px 7px; border-radius: 10px; vertical-align: middle; }
  .pop-doc .cenarios { margin-top: 6px; }
  .pop-doc table.docs { width: 100%; border-collapse: collapse; font-size: 12px; }
  .pop-doc table.docs th, .pop-doc table.docs td { border: 1px solid #d6e0f0; padding: 6px 8px; text-align: left; }
  .pop-doc table.docs th { background: #eaf1fb; color: #1351B4; }
`;
