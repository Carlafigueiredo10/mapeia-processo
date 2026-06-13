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

/** Capa do POP — formas geométricas (azul/laranja) + título. 1 página no PDF. */
function capaHtml(pop: Pop): string {
  const topo = (pop.unidade || pop.area || '').trim();
  return `
    <section class="pop-capa">
      <div class="pop-capa__deco pop-capa__deco--tr"></div>
      <div class="pop-capa__deco pop-capa__deco--bl"></div>
      ${topo ? `<div class="pop-capa__topo">${esc(topo)}</div>` : ''}
      <div class="pop-capa__centro">
        <div class="pop-capa__rotulo">Procedimento Operacional Padrão</div>
        <h1 class="pop-capa__titulo">${esc(pop.nomeProcesso || 'Processo')}</h1>
        <div class="pop-capa__linha"></div>
        <div class="pop-capa__meta">
          ${pop.area ? `<span>Área: ${esc(pop.area)}</span>` : ''}
          <span>Versão ${esc(pop.versao || '1.0')}</span>
          <span>${esc(new Date().toLocaleDateString('pt-BR'))}</span>
        </div>
      </div>
    </section>`;
}

/** Corpo do documento (sem <html>/<style> — usado no preview e no print). */
export function popDocumentoHtml(pop: Pop): string {
  const etapas = pop.etapas || [];
  const etapasHtml = etapas.length
    ? etapas.map((e, i) => etapaHtml(e, i + 1)).join('')
    : '<p class="vazio">[Nenhuma etapa mapeada]</p>';

  return `
    ${capaHtml(pop)}

    ${secao(
      'Identificação do Processo',
      `<div class="ident">
        <p><b>Unidade / Órgão:</b> ${naoInformado(pop.unidade)}</p>
        <p><b>Área:</b> ${naoInformado(pop.area)}</p>
        <p><b>Código na arquitetura:</b> ${naoInformado(pop.codigo)}</p>
        <p><b>Versão:</b> ${esc(pop.versao || '1.0')}</p>
        <p><b>Macroprocesso:</b> ${naoInformado(pop.macroprocesso)}</p>
        <p><b>Processo:</b> ${naoInformado(pop.processoEspecifico)}</p>
        <p><b>Subprocesso:</b> ${naoInformado(pop.subprocesso)}</p>
        <p><b>Atividade:</b> ${pendente(pop.nomeProcesso)}</p>
        <p><b>Tempo estimado do processo:</b> ${naoInformado(pop.tempoEstimado)}</p>
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

  /* ===== Capa ===== */
  .pop-doc .pop-capa {
    position: relative; overflow: hidden; background: #fff;
    min-height: 680px; margin-bottom: 28px; border-radius: 10px;
    border: 3px solid #0d2a5e; page-break-after: always;
    -webkit-print-color-adjust: exact; print-color-adjust: exact;
  }
  .pop-doc .pop-capa__deco { position: absolute; z-index: 0; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  .pop-doc .pop-capa__deco--tr { top: 0; right: 0; width: 60%; height: 240px; background: #1351B4; clip-path: polygon(38% 0, 100% 0, 100% 100%, 0 100%); }
  .pop-doc .pop-capa__deco--tr::before { content: ''; position: absolute; top: 0; right: 0; width: 55%; height: 120px; background: #f2a23c; clip-path: polygon(28% 0, 100% 0, 72% 100%, 0 100%); -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  .pop-doc .pop-capa__deco--tr::after { content: ''; position: absolute; top: 120px; right: 0; width: 42%; height: 120px; background: #0d2a5e; clip-path: polygon(40% 0, 100% 0, 100% 100%, 0 100%); -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  .pop-doc .pop-capa__deco--bl { bottom: 0; left: 0; width: 60%; height: 240px; background: #1351B4; clip-path: polygon(0 0, 100% 0, 62% 100%, 0 100%); }
  .pop-doc .pop-capa__deco--bl::before { content: ''; position: absolute; bottom: 0; left: 0; width: 55%; height: 120px; background: #f2a23c; clip-path: polygon(0 0, 72% 0, 100% 100%, 28% 100%); -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  .pop-doc .pop-capa__deco--bl::after { content: ''; position: absolute; bottom: 120px; left: 0; width: 42%; height: 120px; background: #0d2a5e; clip-path: polygon(0 0, 100% 0, 60% 100%, 0 100%); -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  .pop-doc .pop-capa__topo { position: absolute; z-index: 1; top: 28px; left: 36px; font-size: 12px; letter-spacing: 1px; text-transform: uppercase; color: #1351B4; font-weight: 600; max-width: 45%; }
  .pop-doc .pop-capa__centro { position: absolute; z-index: 1; left: 36px; right: 36px; top: 50%; transform: translateY(-50%); }
  .pop-doc .pop-capa__rotulo { font-size: 13px; letter-spacing: 2px; text-transform: uppercase; color: #5a6b8c; margin-bottom: 8px; }
  .pop-doc .pop-capa__titulo { font-size: 30px; line-height: 1.15; color: #0d2a5e; margin: 0; font-weight: 700; }
  .pop-doc .pop-capa__linha { width: 80px; height: 4px; background: #f2a23c; margin: 16px 0; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  .pop-doc .pop-capa__meta { font-size: 12px; color: #444; display: flex; gap: 16px; flex-wrap: wrap; }
  @media print { .pop-doc .pop-capa { min-height: 245mm; } }
`;
