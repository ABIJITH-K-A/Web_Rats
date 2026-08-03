import React from "react";
import { AlertTriangle, Home, RefreshCw, AlertCircle } from "lucide-react";

/**
 * ErrorBoundary - Rynix System Resilience Layer
 * Now supports two variants:
 * - 'page': Full-screen takeover for catastrophic app failure.
 * - 'module': Inline error card for specific component failure.
 */
export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error(`[ErrorBoundary:${this.props.variant || 'page'}]`, error, errorInfo);
  }

  handleReset = () => {
    if (this.props.onReset) {
      this.props.onReset();
    }
    this.setState({ hasError: false, error: null });
  };

  render() {
    const { variant = "page", children } = this.props;

    if (this.state.hasError) {
      if (variant === "module") {
        return (
          <div className="flex flex-col items-center justify-center rounded-[2.5rem] border border-red-500/20 bg-red-500/5 p-8 text-center shadow-2xl animate-in fade-in zoom-in duration-300">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-red-500/10 text-red-500">
              <AlertCircle size={24} />
            </div>
            <h3 className="mt-4 text-lg font-bold text-white">Something went wrong</h3>
            <p className="mt-2 max-w-sm text-xs leading-relaxed text-light-gray/50">
              We couldn't load this component. The rest of the site is still working.
            </p>
            <button
              onClick={this.handleReset}
              className="mt-6 flex items-center justify-center gap-2 rounded-xl bg-red-500/10 px-6 py-2.5 text-[10px] font-mono uppercase tracking-widest text-red-500 border border-red-500/20 hover:bg-red-500/20 transition-all"
            >
              <RefreshCw size={14} /> Try Again
            </button>
          </div>
        );
      }

      return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-[#0B120C] px-6 text-center text-white font-rajdhani">
          <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-red-500/10 text-red-500 shadow-[0_0_30px_rgba(239, 68, 68, 0.2)]">
            <AlertTriangle size={40} />
          </div>
          
          <h1 className="mt-8 text-4xl font-black tracking-tight sm:text-5xl italic uppercase">
            Something <span className="text-red-500">Went Wrong</span>
          </h1>
          
          <p className="mx-auto mt-4 max-w-[500px] text-sm font-normal uppercase tracking-[0.2em] text-light-gray/40">
            We couldn't load this page. Please try refreshing, or contact support if the problem persists.
          </p>

          <div className="mt-10 flex flex-col gap-4 sm:flex-row sm:justify-center">
            <button
              onClick={() => window.location.reload()}
              className="flex items-center justify-center gap-3 rounded-2xl bg-white px-8 py-4 text-xs font-black uppercase tracking-widest text-black transition-transform hover:scale-105"
            >
              <RefreshCw size={18} /> Try Again
            </button>
            <a
              href="/"
              className="flex items-center justify-center gap-3 rounded-2xl border border-white/10 px-8 py-4 text-xs font-black uppercase tracking-widest text-white transition-colors hover:bg-white/5"
            >
              <Home size={18} /> Go Home
            </a>
            <a
              href="mailto:hello@rynix.studio"
              className="flex items-center justify-center gap-3 rounded-2xl border border-white/10 px-8 py-4 text-xs font-black uppercase tracking-widest text-white transition-colors hover:bg-white/5"
            >
              <AlertCircle size={18} /> Contact Support
            </a>
          </div>
        </div>
      );
    }

    return children;
  }
}

export default ErrorBoundary;
