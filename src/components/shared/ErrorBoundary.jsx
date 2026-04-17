import { Component } from "react";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";

/**
 * React Error Boundary — catches any render-time JavaScript errors
 * anywhere in the component tree below it and shows a friendly UI.
 */
export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    console.error("[ErrorBoundary] Caught error:", error, info);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
    if (this.props.onReset) this.props.onReset();
  };

  render() {
    if (!this.state.hasError) return this.props.children;

    const { fallback, minimal } = this.props;

    // Allow custom fallback UI
    if (fallback) return fallback;

    // Minimal inline error (for section-level boundaries)
    if (minimal) {
      return (
        <div className="flex flex-col items-center justify-center py-12 px-6 text-center">
          <div className="w-10 h-10 bg-red-50 rounded-full flex items-center justify-center mb-3">
            <AlertTriangle size={18} className="text-red-500" />
          </div>
          <p className="text-[14px] font-semibold text-stone-800 mb-1">Something went wrong</p>
          <p className="text-[12.5px] text-stone-500 font-medium mb-4">
            This section couldn't load. Try refreshing.
          </p>
          <button
            onClick={this.handleReset}
            className="flex items-center gap-1.5 text-[13px] font-bold text-stone-700 bg-cream-100 hover:bg-cream-200 px-3 py-2 rounded-lg transition-colors"
          >
            <RefreshCw size={13} /> Try again
          </button>
        </div>
      );
    }

    // Full-page error fallback
    return (
      <div className="min-h-screen flex items-center justify-center bg-cream-bg px-4">
        <div className="w-full max-w-md text-center animate-fade-in">
          <div className="w-16 h-16 bg-red-50 border border-red-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <AlertTriangle size={28} className="text-red-500" />
          </div>
          <h1 className="text-xl font-bold text-stone-900 mb-2">Something went wrong</h1>
          <p className="text-[14px] text-stone-500 font-medium mb-1">
            An unexpected error occurred. This has been noted.
          </p>
          {this.state.error?.message && (
            <p className="text-[12px] font-mono text-stone-400 bg-cream-100 border border-cream-200 rounded-xl px-4 py-2 mt-3 mb-6 text-left break-words">
              {this.state.error.message}
            </p>
          )}
          <div className="flex flex-col sm:flex-row gap-3 justify-center mt-6">
            <button
              onClick={this.handleReset}
              className="btn-primary py-3 px-6 text-[14px]"
            >
              <RefreshCw size={16} /> Try Again
            </button>
            <a
              href="/"
              className="btn-secondary py-3 px-6 text-[14px] flex items-center justify-center gap-2"
            >
              <Home size={16} /> Go Home
            </a>
          </div>
        </div>
      </div>
    );
  }
}
