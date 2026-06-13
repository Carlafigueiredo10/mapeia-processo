import { useEffect, useMemo, useRef, useState } from 'react';
import type { Pop } from './core/types';
import { popVazio } from './core/types';
import { popParaFluxograma } from './core/popParaFluxograma';
import { gerarMermaid } from './core/gerarMermaid';
import { exportarPopJson, importarPopJson, nomeArquivo, normalizarPop, parseJsonSeguro } from './core/popIo';
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
        setPop(importarPopJson(String(reader.result)));
      } catch {
        alert('Não foi possível abrir: arquivo .json inválido.');
      }
    };
    reader.readAsText(file);
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
          <button className="btn btn--ghost" onClick={() => fileRef.current?.click()}>Abrir .json</button>
          <button className="btn btn--ghost" onClick={baixarJson}>Baixar .json</button>
          <button className="btn btn--ghost" onClick={limpar}>Novo POP</button>
        </div>
      </header>

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
        Software livre · seus dados ficam só no seu navegador (nada é enviado a servidor).
      </footer>
    </div>
  );
}
