import { Component } from 'react';
import type { ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}
interface State {
  erro: boolean;
}

/** Impede que um erro de render (ex.: POP malformado) derrube a aplicação. */
export default class ErrorBoundary extends Component<Props, State> {
  state: State = { erro: false };

  static getDerivedStateFromError(): State {
    return { erro: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    // Log local apenas (nada é enviado a servidor).
    console.error('[MapeiaProcesso] erro de render:', error, info);
  }

  reset = () => this.setState({ erro: false });

  render() {
    if (this.state.erro) {
      return (
        <div className="erro-boundary">
          <h3>Algo deu errado ao montar a visualização.</h3>
          <p>Isso costuma acontecer com um arquivo importado fora do formato. Seus dados não foram perdidos.</p>
          <button className="btn" onClick={this.reset}>Tentar de novo</button>
        </div>
      );
    }
    return this.props.children;
  }
}
