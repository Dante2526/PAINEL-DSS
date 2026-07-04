import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  copied: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
    copied: false
  };

  public static getDerivedStateFromError(error: Error): State {
    // Atualiza o estado para que a próxima renderização mostre a UI de fallback.
    return { hasError: true, error, errorInfo: null, copied: false };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
    localStorage.setItem('last_caught_error', JSON.stringify({
      message: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack
    }));
    this.setState({
      error,
      errorInfo
    });
  }

  private handleCopy = () => {
    const { error, errorInfo } = this.state;
    const textToCopy = `Error: ${error?.message}\n\nStack:\n${error?.stack}\n\nComponent Stack:\n${errorInfo?.componentStack}`;
    navigator.clipboard.writeText(textToCopy).then(() => {
      this.setState({ copied: true });
      setTimeout(() => this.setState({ copied: false }), 3000);
    });
  };

  private handleReload = () => {
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-light-card dark:bg-dark-card rounded-2xl shadow-2xl p-6 w-full max-w-2xl max-h-[90vh] flex flex-col border-2 border-danger/50 relative overflow-hidden">
            
            {/* Header */}
            <div className="flex items-center gap-4 mb-4 shrink-0 pb-4 border-b border-gray-200 dark:border-gray-700">
              <div className="w-12 h-12 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center shrink-0 text-danger">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <div>
                <h2 className="text-xl font-bold uppercase text-danger">Sistema Anti-Bug Ativado</h2>
                <p className="text-sm text-light-text-secondary dark:text-dark-text-secondary">
                  O painel encontrou um erro inesperado.
                </p>
              </div>
            </div>

            {/* Error Content */}
            <div className="flex-1 overflow-y-auto mb-4 bg-gray-100 dark:bg-gray-900 rounded-xl p-4 font-mono text-xs border border-gray-200 dark:border-gray-800">
              <div className="text-danger font-bold text-base mb-2">
                {this.state.error && this.state.error.toString()}
              </div>
              <div className="text-gray-600 dark:text-gray-400 whitespace-pre-wrap">
                {this.state.errorInfo?.componentStack || this.state.error?.stack}
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3 shrink-0">
              <button
                onClick={this.handleCopy}
                className={`flex-1 py-3 rounded-lg font-bold uppercase tracking-wide transition-all shadow-md flex items-center justify-center gap-2 ${
                  this.state.copied 
                    ? 'bg-success text-white' 
                    : 'bg-primary hover:bg-primary-dark text-white'
                }`}
              >
                {this.state.copied ? (
                  <>
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    COPIADO!
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                    </svg>
                    COPIAR ERRO
                  </>
                )}
              </button>
              
              <button
                onClick={this.handleReload}
                className="py-3 px-6 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-light-text dark:text-white rounded-lg font-bold uppercase transition-all shadow-md"
              >
                RECARREGAR PÁGINA
              </button>
            </div>
            
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
