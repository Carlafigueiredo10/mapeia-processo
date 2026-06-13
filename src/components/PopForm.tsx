import type { Cenario, DocumentoPop, Etapa, Pop } from '../core/types';

interface Props {
  pop: Pop;
  onChange: (pop: Pop) => void;
}

const linhasParaArray = (s: string): string[] =>
  s.split('\n').map((x) => x.trim()).filter(Boolean);
const arrayParaLinhas = (a?: string[]): string => (a || []).join('\n');

let seq = 0;
const novoId = () => `etapa-${Date.now()}-${seq++}`;

export default function PopForm({ pop, onChange }: Props) {
  const set = (patch: Partial<Pop>) => onChange({ ...pop, ...patch });

  // --- etapas ---
  const addEtapa = (tipo: Etapa['tipo']) =>
    set({
      etapas: [
        ...pop.etapas,
        tipo === 'condicional'
          ? { id: novoId(), tipo, acaoPrincipal: '', cenarios: [{ descricao: 'Sim', subetapas: [] }, { descricao: 'Não', subetapas: [] }] }
          : { id: novoId(), tipo, acaoPrincipal: '' },
      ],
    });

  const updEtapa = (i: number, patch: Partial<Etapa>) => {
    const etapas = pop.etapas.slice();
    etapas[i] = { ...etapas[i], ...patch };
    set({ etapas });
  };
  const rmEtapa = (i: number) => set({ etapas: pop.etapas.filter((_, j) => j !== i) });
  const moveEtapa = (i: number, dir: -1 | 1) => {
    const j = i + dir;
    if (j < 0 || j >= pop.etapas.length) return;
    const etapas = pop.etapas.slice();
    [etapas[i], etapas[j]] = [etapas[j], etapas[i]];
    set({ etapas });
  };

  const updCenario = (ei: number, ci: number, patch: Partial<Cenario>) => {
    const etapa = pop.etapas[ei];
    const cenarios = (etapa.cenarios || []).slice();
    cenarios[ci] = { ...cenarios[ci], ...patch };
    updEtapa(ei, { cenarios });
  };
  const addCenario = (ei: number) => {
    const etapa = pop.etapas[ei];
    updEtapa(ei, { cenarios: [...(etapa.cenarios || []), { descricao: '', subetapas: [] }] });
  };
  const rmCenario = (ei: number, ci: number) => {
    const etapa = pop.etapas[ei];
    updEtapa(ei, { cenarios: (etapa.cenarios || []).filter((_, j) => j !== ci) });
  };

  // --- documentos (seção 6) ---
  const addDoc = () => set({ documentos: [...(pop.documentos || []), { descricao: '' }] });
  const updDoc = (i: number, patch: Partial<DocumentoPop>) => {
    const documentos = (pop.documentos || []).slice();
    documentos[i] = { ...documentos[i], ...patch };
    set({ documentos });
  };
  const rmDoc = (i: number) => set({ documentos: (pop.documentos || []).filter((_, j) => j !== i) });

  return (
    <div className="form">
      <fieldset>
        <legend>Identificação</legend>
        <label>Nome do processo / atividade *
          <input value={pop.nomeProcesso} onChange={(e) => set({ nomeProcesso: e.target.value })}
            placeholder="Ex.: Concessão de pensão por morte" />
        </label>
        <div className="grid2">
          <label>Unidade / Órgão
            <input value={pop.unidade || ''} onChange={(e) => set({ unidade: e.target.value })} />
          </label>
          <label>Área (organizacional)
            <input value={pop.area || ''} onChange={(e) => set({ area: e.target.value })} placeholder="Ex.: Coordenação de Benefícios" />
          </label>
          <label>Código na arquitetura
            <input value={pop.codigo || ''} onChange={(e) => set({ codigo: e.target.value })} />
          </label>
          <label>Versão
            <input value={pop.versao} onChange={(e) => set({ versao: e.target.value })} />
          </label>
          <label>Macroprocesso
            <input value={pop.macroprocesso || ''} onChange={(e) => set({ macroprocesso: e.target.value })} />
          </label>
          <label>Processo
            <input value={pop.processoEspecifico || ''} onChange={(e) => set({ processoEspecifico: e.target.value })} />
          </label>
          <label>Subprocesso
            <input value={pop.subprocesso || ''} onChange={(e) => set({ subprocesso: e.target.value })} />
          </label>
          <label>Tempo estimado do processo <small>(uma vez, não por etapa)</small>
            <input value={pop.tempoEstimado || ''} onChange={(e) => set({ tempoEstimado: e.target.value })} placeholder="Ex.: 5 dias úteis" />
          </label>
        </div>
      </fieldset>

      <fieldset>
        <legend>1. Entrega esperada</legend>
        <textarea rows={2} value={pop.entregaEsperada || ''} onChange={(e) => set({ entregaEsperada: e.target.value })} />
      </fieldset>

      <fieldset>
        <legend>2. Dispositivos normativos</legend>
        <textarea rows={2} value={pop.dispositivosNormativos || ''} onChange={(e) => set({ dispositivosNormativos: e.target.value })} />
        <p className="dica">
          Precisa localizar uma norma?{' '}
          <a href="https://legis.sigepe.gov.br/legis/chat-legis" target="_blank" rel="noopener noreferrer">
            Pesquisar no Sigepe Legis ↗
          </a>
        </p>
      </fieldset>

      <fieldset>
        <legend>3. Sistemas utilizados <small>(um por linha)</small></legend>
        <textarea rows={3} value={arrayParaLinhas(pop.sistemasUtilizados)}
          onChange={(e) => set({ sistemasUtilizados: linhasParaArray(e.target.value) })} />
      </fieldset>

      <fieldset>
        <legend>4. Operadores</legend>
        <textarea rows={2} value={pop.operadores || ''} onChange={(e) => set({ operadores: e.target.value })} />
      </fieldset>

      <fieldset>
        <legend>5. Tarefas (etapas)</legend>
        {pop.etapas.map((etapa, i) => (
          <div key={etapa.id} className={`etapa-card ${etapa.tipo === 'condicional' ? 'etapa-card--dec' : ''}`}>
            <div className="etapa-card__head">
              <strong>{i + 1}. {etapa.tipo === 'condicional' ? 'Decisão' : 'Etapa'}</strong>
              <div className="etapa-card__btns">
                <button type="button" onClick={() => moveEtapa(i, -1)} title="Subir">↑</button>
                <button type="button" onClick={() => moveEtapa(i, 1)} title="Descer">↓</button>
                <button type="button" onClick={() => rmEtapa(i)} title="Remover">✕</button>
              </div>
            </div>

            <label>{etapa.tipo === 'condicional' ? 'Pergunta da decisão' : 'Ação'}
              <input value={etapa.acaoPrincipal} onChange={(e) => updEtapa(i, { acaoPrincipal: e.target.value })}
                placeholder={etapa.tipo === 'condicional' ? 'Ex.: Documentação atende aos requisitos?' : 'Ex.: Receber e registrar a demanda'} />
            </label>

            {etapa.tipo === 'normal' && (
              <>
                <label>Operador
                  <input value={etapa.operador || ''} onChange={(e) => updEtapa(i, { operador: e.target.value })} />
                </label>
                <div className="grid2">
                  <label>Sistemas <small>(vírgula)</small>
                    <input value={(etapa.sistemas || []).join(', ')}
                      onChange={(e) => updEtapa(i, { sistemas: e.target.value.split(',').map((s) => s.trim()).filter(Boolean) })} />
                  </label>
                  <label>Docs requeridos <small>(vírgula)</small>
                    <input value={(etapa.docsRequeridos || []).join(', ')}
                      onChange={(e) => updEtapa(i, { docsRequeridos: e.target.value.split(',').map((s) => s.trim()).filter(Boolean) })} />
                  </label>
                  <label>Docs gerados <small>(vírgula)</small>
                    <input value={(etapa.docsGerados || []).join(', ')}
                      onChange={(e) => updEtapa(i, { docsGerados: e.target.value.split(',').map((s) => s.trim()).filter(Boolean) })} />
                  </label>
                  <label>Verificações <small>(uma por linha)</small>
                    <textarea rows={2} value={arrayParaLinhas(etapa.verificacoes)}
                      onChange={(e) => updEtapa(i, { verificacoes: linhasParaArray(e.target.value) })} />
                  </label>
                </div>
              </>
            )}

            {etapa.tipo === 'condicional' && (
              <div className="cenarios-edit">
                {(etapa.cenarios || []).map((c, ci) => (
                  <div key={ci} className="cenario-edit">
                    <div className="grid2">
                      <label>Caminho <small>(rótulo da seta)</small>
                        <input value={c.descricao} onChange={(e) => updCenario(i, ci, { descricao: e.target.value })}
                          placeholder="Ex.: Sim" />
                      </label>
                      <button type="button" className="link-danger" onClick={() => rmCenario(i, ci)}>remover caminho</button>
                    </div>
                    <label>Passos deste caminho <small>(um por linha)</small>
                      <textarea rows={2} value={arrayParaLinhas((c.subetapas || []).map((s) => s.descricao))}
                        onChange={(e) => updCenario(i, ci, { subetapas: linhasParaArray(e.target.value).map((d) => ({ descricao: d })) })} />
                    </label>
                  </div>
                ))}
                <button type="button" className="link" onClick={() => addCenario(i)}>+ adicionar caminho</button>
              </div>
            )}
          </div>
        ))}
        <div className="add-etapa">
          <button type="button" className="btn" onClick={() => addEtapa('normal')}>+ Etapa</button>
          <button type="button" className="btn" onClick={() => addEtapa('condicional')}>+ Decisão</button>
        </div>
      </fieldset>

      <fieldset>
        <legend>6. Documentos / formulários utilizados</legend>
        {(pop.documentos || []).map((d, i) => (
          <div key={i} className="doc-row">
            <div className="grid2">
              <label>Descrição
                <input value={d.descricao} onChange={(e) => updDoc(i, { descricao: e.target.value })} />
              </label>
              <label>Tipo
                <input value={d.tipo || ''} onChange={(e) => updDoc(i, { tipo: e.target.value })} placeholder="Formulário, Ofício..." />
              </label>
              <label>Uso
                <input value={d.uso || ''} onChange={(e) => updDoc(i, { uso: e.target.value })} placeholder="Entrada / Saída" />
              </label>
              <label>Sistema
                <input value={d.sistema || ''} onChange={(e) => updDoc(i, { sistema: e.target.value })} />
              </label>
            </div>
            <div className="doc-row__foot">
              <label className="inline">
                <input type="checkbox" checked={!!d.obrigatorio} onChange={(e) => updDoc(i, { obrigatorio: e.target.checked })} />
                Obrigatório
              </label>
              <button type="button" className="link-danger" onClick={() => rmDoc(i)}>remover</button>
            </div>
          </div>
        ))}
        <button type="button" className="link" onClick={addDoc}>+ adicionar documento</button>
      </fieldset>

      <fieldset>
        <legend>7. Pontos de atenção</legend>
        <textarea rows={2} value={pop.pontosAtencao || ''} onChange={(e) => set({ pontosAtencao: e.target.value })} />
      </fieldset>
    </div>
  );
}
