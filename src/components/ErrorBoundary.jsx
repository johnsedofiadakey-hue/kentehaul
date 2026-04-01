import React from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Critical Application Error Caught:", error, errorInfo);
  }

  handleRestart = () => {
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-neutral-50 flex flex-col items-center justify-center p-6 text-center font-sans">
          <div className="w-24 h-24 bg-red-50 text-red-500 rounded-[32px] flex items-center justify-center mb-8 shadow-xl shadow-red-100/50 animate-bounce">
            <AlertTriangle size={48} />
          </div>
          
          <h1 className="text-4xl font-black text-gray-900 uppercase tracking-tighter mb-4">
            Heritage Restoration Required
          </h1>
          
          <p className="text-gray-500 max-w-md mb-10 font-bold leading-relaxed">
            The KenteHaul loom encountered an unexpected thread blockage. Deepest apologies for this interruption in your royal experience.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 w-full max-w-xs">
            <button
              onClick={() => window.location.reload()}
              className="flex-1 px-8 py-4 bg-gray-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-black transition-all shadow-xl flex items-center justify-center gap-3 active:scale-95"
            >
              <RefreshCw size={16} />
              Re-Synchronize
            </button>
            <button
              onClick={this.handleRestart}
              className="flex-1 px-8 py-4 bg-white text-gray-900 rounded-2xl font-black text-[10px] uppercase tracking-widest border border-gray-100 hover:bg-gray-50 transition-all flex items-center justify-center gap-3 active:scale-95"
            >
              <Home size={16} />
              Return Home
            </button>
          </div>

          <div className="mt-20 pt-10 border-t border-gray-100 w-full max-w-lg">
            <p className="text-[10px] font-black text-gray-300 uppercase tracking-[4px]">
              KenteHaul Maintenance Log #{Date.now().toString().slice(-6)}
            </p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
