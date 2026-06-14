import { useEffect, useMemo, useRef, useState } from 'react';
import type { Pop } from './core/types';
import { popVazio } from './core/types';
import { popParaFluxograma } from './core/popParaFluxograma';
import { gerarMermaid } from './core/gerarMermaid';
import { exportarPopJson, importarPopJson, nomeArquivo, normalizarPop, parseJsonSeguro, proximaVersao } from './core/popIo';
import PopForm from './components/PopForm';
import PopDocumento from './components/PopDocumento';
import FluxogramaPreview from './components/FluxogramaPreview';
import ErrorBoundary from './components/ErrorBoundary';
import './App.css';

const STORAGE_KEY = 'mapeia-processo:pop';

function carregar(): Pop {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return normalizarPop(parseJsonSeguro(raw));
  } catch {
    /* ignora — começa com POP vazio */
  }
  return popVazio();
}

type Aba = 'documento' | 'fluxograma';

export default function App() {
  const [pop, setPop] = useState<Pop>(carregar);
  const [aba, setAba] = useState<Aba>('documento');
  const fileRef = useRef<HTMLInputElement>(null);
  // Sugestão de nova versão após abrir um POP para edição (null = sem banner).
  const [versaoSugerida, setVersaoSugerida] = useState<string | null>(null);

  useEffect(() => {
    const t = setTimeout(() => localStorage.setItem(STORAGE_KEY, JSON.stringify(pop)), 300);
    return () => clearTimeout(t);
  }, [pop]);

  const mermaidCode = useMemo(() => {
    const fluxo = popParaFluxograma(pop.etapas);
    return gerarMermaid(fluxo, pop.nomeProcesso || 'Processo');
  }, [pop.etapas, pop.nomeProcesso]);

  const limpar = () => {
    if (confirm('Limpar tudo e começar um novo POP?')) setPop(popVazio());
  };

  const baixarJson = () => {
    const blob = new Blob([exportarPopJson(pop)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = nomeArquivo(pop);
    a.click();
    URL.revokeObjectURL(url);
  };

  const abrirJson = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const novo = importarPopJson(String(reader.result));
        setPop(novo);
        // Editando um POP existente: sugere registrar como nova versão.
        setVersaoSugerida(novo.nomeProcesso ? proximaVersao(novo.versao) : null);
      } catch {
        alert('Não consegui abrir este arquivo. Selecione o arquivo editável do POP (o que você baixou em "Salvar arquivo editável").');
      }
    };
    reader.readAsText(file);
  };

  const aplicarVersao = () => {
    if (versaoSugerida) setPop((p) => ({ ...p, versao: versaoSugerida }));
    setVersaoSugerida(null);
  };

  return (
    <div className="app">
      <header className="app__top">
        <div className="app__brand">
          <span className="app__logo">▤</span>
          <div>
            <h1>MapeiaProcesso</h1>
            <p>Mapeie seu processo, gere o POP e o fluxograma — tudo no navegador.</p>
          </div>
        </div>
        <div className="app__top-actions">
          <input
            ref={fileRef}
            type="file"
            accept="application/json,.json"
            style={{ display: 'none' }}
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) abrirJson(f);
              e.target.value = '';
            }}
          />
          <button className="btn btn--ghost" onClick={() => fileRef.current?.click()} title="Abra o arquivo editável de um POP que você salvou antes">Editar um POP</button>
          <button className="btn btn--ghost" onClick={baixarJson} title="Baixa o arquivo editável deste POP, para você alterar depois">Salvar arquivo editável</button>
          <button className="btn btn--ghost" onClick={limpar}>Novo POP</button>
        </div>
      </header>

      {versaoSugerida && (
        <div className="edit-banner">
          <span>
            POP carregado para edição. Quer registrar como uma nova versão?
            Sugestão: <strong>versão {versaoSugerida}</strong> (a atual é {pop.versao}).
          </span>
          <span className="edit-banner__acoes">
            <button className="btn btn--primary" onClick={aplicarVersao}>Usar versão {versaoSugerida}</button>
            <button className="btn" onClick={() => setVersaoSugerida(null)}>Manter {pop.versao}</button>
          </span>
        </div>
      )}

      <main className="app__main">
        <section className="app__col app__col--form">
          <PopForm pop={pop} onChange={setPop} />
        </section>

        <section className="app__col app__col--preview">
          <div className="tabs">
            <button className={aba === 'documento' ? 'tab tab--on' : 'tab'} onClick={() => setAba('documento')}>
              Documento (POP)
            </button>
            <button className={aba === 'fluxograma' ? 'tab tab--on' : 'tab'} onClick={() => setAba('fluxograma')}>
              Fluxograma
            </button>
          </div>

          <ErrorBoundary key={aba}>
            {aba === 'documento' ? (
              <PopDocumento pop={pop} />
            ) : (
              <FluxogramaPreview
                code={mermaidCode}
                titulo={pop.nomeProcesso || 'Fluxograma de Processo'}
                versao={pop.versao}
                unidade={pop.unidade}
              />
            )}
          </ErrorBoundary>
        </section>
      </main>

      <footer className="app__footer">
        Software livre · o conteúdo do seu POP fica só neste navegador (nunca é enviado).
        Medimos apenas acessos, de forma anônima e sem cookies.
        Em computador compartilhado, clique em <strong>Novo POP</strong> ao terminar para limpar.
        {' · '}
        <a href={`${import.meta.env.BASE_URL}manual.html`} target="_blank" rel="noopener noreferrer">Manual do sistema</a>
      </footer>
    </div>
  );
}
