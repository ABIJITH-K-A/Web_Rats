import React from "react";
import { AlertTriangle, Home, RefreshCw } from "lucide-react";

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI.
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    // You can also log the error to an error reporting service like Sentry
    console.error("ErrorBoundary caught an error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      // You can render any custom fallback UI
      return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-primary-dark px-6 text-center text-white">
          <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-red-500/10 text-red-500">
            <AlertTriangle size={40} />
          </div>
          
          <h1 className="mt-8 text-4xl font-black tracking-tight sm:text-5xl">
            Something went wrong
          </h1>
          
          <p className="mx-auto mt-4 max-w-[500px] text-lg text-light-gray/60">
            We apologize, but an unexpected error has occurred. Our team has been notified.
          </p>

          {process.env.NODE_ENV === 'development' && this.state.error && (
            <div className="mt-8 max-w-[600px] overflow-auto rounded-xl bg-black/50 p-4 text-left font-mono text-sm text-red-400">
              {this.state.error.toString()}
            </div>
          )}

          <div className="mt-10 flex flex-col gap-4 sm:flex-row sm:justify-center">
            <button
              onClick={() => window.location.reload()}
              className="flex items-center justify-center gap-2 rounded-2xl bg-white px-8 py-4 font-bold text-black transition-transform hover:scale-105"
            >
              <RefreshCw size={20} />
              Try Again
            </button>
            
            <a
              href="/"
              className="flex items-center justify-center gap-2 rounded-2xl border border-white/10 px-8 py-4 font-bold text-white transition-colors hover:bg-white/5"
            >
              <Home size={20} />
              Go Home
            </a>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
