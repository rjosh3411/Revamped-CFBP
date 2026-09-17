import React from 'react';
import { AlertCircle, RefreshCw, Home } from 'lucide-react';

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught an unhandled error:', error, errorInfo);
    this.setState({ error, errorInfo });
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="my-6 p-6 rounded-3xl bg-slate-900 border border-red-500/40 text-slate-200 shadow-2xl max-w-2xl mx-auto text-center">
          <div className="w-12 h-12 rounded-2xl bg-red-500/20 border border-red-500/40 flex items-center justify-center text-red-400 mx-auto mb-4">
            <AlertCircle className="w-6 h-6" />
          </div>
          <h3 className="text-xl font-black text-white uppercase tracking-wider mb-2">
            Temporary Loading Glitch Caught
          </h3>
          <p className="text-xs text-slate-400 mb-4 max-w-md mx-auto">
            {this.props.message || 'We caught a render glitch and prevented the page from crashing. Click below to refresh your view.'}
          </p>
          <div className="flex items-center justify-center space-x-3">
            <button
              onClick={this.handleReset}
              className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-black text-xs uppercase tracking-wider flex items-center space-x-2 transition shadow-lg shadow-amber-500/20"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Retry View</span>
            </button>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs uppercase tracking-wider flex items-center space-x-2 transition border border-white/10"
            >
              <Home className="w-4 h-4" />
              <span>Full Reload</span>
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
