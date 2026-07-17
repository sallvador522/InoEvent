import React, { Component, ErrorInfo, ReactNode } from 'react';
import { motion } from 'motion/react';
import { RefreshCw, AlertTriangle, ChevronRight, Copy, Check } from 'lucide-react';
import { logger } from '../lib/logger';
import { toast } from 'react-hot-toast';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  copied: boolean;
  showDetails: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
    copied: false,
    showDetails: false,
  };

  public static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({ errorInfo });
    logger.error(`React Component Crash: ${error.message}`, {
      category: 'SYSTEM',
      data: {
        error: error.stack,
        componentStack: errorInfo.componentStack
      }
    });
  }

  private handleReload = () => {
    window.location.reload();
  };

  private handleCopy = async () => {
    const diagnosticPayload = {
      errorMessage: this.state.error?.message || 'Nenhum erro detalhado',
      errorStack: this.state.error?.stack || 'Nenhuma pilha disponível',
      componentStack: this.state.errorInfo?.componentStack || 'Nenhum stack de componente disponível',
      url: window.location.href,
      userAgent: navigator.userAgent,
      timestamp: new Date().toISOString()
    };

    try {
      await navigator.clipboard.writeText(JSON.stringify(diagnosticPayload, null, 2));
      this.setState({ copied: true });
      toast.success('Dados de diagnóstico copiados para a área de transferência!');
      setTimeout(() => this.setState({ copied: false }), 2000);
    } catch (err) {
      toast.error('Não foi possível copiar os dados de diagnóstico.');
    }
  };

  public render() {
    if (this.state.hasError) {
      if (this.fallbackCustom()) {
        return this.fallbackCustom();
      }
    }

    return this.props.children;
  }

  private fallbackCustom() {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-6 font-sans relative overflow-hidden">
        {/* Spatial UI Atmospheric Backdrop Circles */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-600/10 rounded-full blur-[120px] pointer-events-none"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-600/10 rounded-full blur-[120px] pointer-events-none"></div>
        
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className="relative max-w-xl w-full bg-slate-900/45 border border-white/10 backdrop-blur-3xl rounded-[32px] p-8 md:p-10 shadow-[0_30px_100px_rgba(0,0,0,0.8)] overflow-hidden"
        >
          {/* Top visual accents */}
          <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>
          
          <div className="flex flex-col items-center text-center">
            {/* Elegant warning badge */}
            <div className="w-16 h-16 rounded-3xl bg-gradient-to-br from-red-500/20 to-rose-500/10 border border-red-500/20 flex items-center justify-center mb-6 shadow-inner relative">
              <div className="absolute inset-0 bg-red-500/5 rounded-3xl blur-md"></div>
              <AlertTriangle className="text-red-400" size={28} />
            </div>

            <h1 className="text-2xl font-bold tracking-tight text-white mb-3">
              Ocorreu um desvio inesperado
            </h1>
            
            <p className="text-sm text-slate-400 leading-relaxed mb-8 max-w-md">
              O InoEvents encontrou uma exceção inesperada ao renderizar esta página. Salvaguardámos os seus dados e o restante ecossistema permanece totalmente operacional.
            </p>

            {/* Micro-interactive controls */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full mb-8">
              <motion.button
                whileHover={{ scale: 1.02, y: -1 }}
                whileTap={{ scale: 0.98 }}
                onClick={this.handleReload}
                className="w-full bg-white text-slate-950 font-bold py-3.5 px-6 rounded-2xl transition-all shadow-lg flex items-center justify-center gap-2 text-xs"
              >
                <RefreshCw size={14} className="animate-spin-slow" />
                Recarregar Página
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.02, y: -1 }}
                whileTap={{ scale: 0.98 }}
                onClick={this.handleCopy}
                className="w-full bg-slate-800 hover:bg-slate-750 text-white font-semibold py-3.5 px-6 rounded-2xl transition-all border border-white/5 flex items-center justify-center gap-2 text-xs"
              >
                {this.state.copied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                {this.state.copied ? 'Copiado!' : 'Copiar Diagnóstico'}
              </motion.button>
            </div>

            {/* Accordion containing technical error stack trace for professional debugging */}
            <div className="w-full border-t border-white/5 pt-6 text-left">
              <button
                type="button"
                onClick={() => this.setState(prev => ({ showDetails: !prev }))}
                className="flex items-center justify-between w-full text-xs text-slate-400 hover:text-white transition-colors py-2 focus:outline-none"
              >
                <span className="font-medium tracking-wide uppercase text-[10px]">Detalhes Técnicos</span>
                <ChevronRight 
                  size={16} 
                  className={`transform transition-transform duration-350 ${this.state.showDetails ? 'rotate-90 text-white' : ''}`} 
                />
              </button>

              <motion.div
                initial={false}
                animate={{ 
                  height: this.state.showDetails ? 'auto' : 0,
                  opacity: this.state.showDetails ? 1 : 0
                }}
                transition={{ duration: 0.3, ease: 'easeInOut' }}
                className="overflow-hidden"
              >
                <div className="mt-4 p-4 rounded-xl bg-slate-950/80 border border-white/5 text-[11px] font-mono text-slate-400 overflow-x-auto max-h-48 leading-relaxed scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
                  <span className="text-red-400 font-bold block mb-1">
                    Error: {this.state.error?.message || 'Exceção não categorizada'}
                  </span>
                  <span className="whitespace-pre block text-slate-500">
                    {this.state.error?.stack || 'Sem rastreio de pilha de erro.'}
                  </span>
                </div>
              </motion.div>
            </div>

          </div>
        </motion.div>
      </div>
    );
  }
}
export default ErrorBoundary;
