import React, { Component, ErrorInfo, ReactNode } from 'react';
import { RefreshCw, AlertTriangle } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[ErrorBoundary] Uncaught error:', error, errorInfo);
  }

  private handleReset = () => {
    try {
      this.setState({ hasError: false, error: null });
      window.location.reload();
    } catch {
      window.location.href = '/';
    }
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-6 text-center">
          <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-8 h-8" />
            </div>
            
            <div className="space-y-1.5">
              <h2 className="text-lg font-black tracking-tight text-white">Une erreur inattendue est survenue</h2>
              <p className="text-xs text-slate-400">
                La session a été préservée en toute sécurité. Cliquez sur le bouton ci-dessous pour rafraîchir la plateforme.
              </p>
            </div>

            {this.state.error?.message && (
              <div className="p-3 bg-black/40 rounded-xl border border-slate-800 text-[11px] font-mono text-slate-400 text-left overflow-x-auto max-h-24">
                {this.state.error.message}
              </div>
            )}

            <button
              onClick={this.handleReset}
              className="w-full py-3.5 px-4 bg-emerald-500 hover:bg-emerald-600 active:bg-emerald-700 text-black font-extrabold text-xs uppercase tracking-wider rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-emerald-500/20"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Rafraîchir et Continuer</span>
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
