import React from 'react';
import { AlertTriangle, RefreshCw, Home, ChevronDown, ChevronUp } from 'lucide-react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, showDetails: false };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("CRITICAL ERROR:", error, errorInfo);
  }

  handleRestart = () => {
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-neutral-100 flex flex-col items-center justify-center p-6 text-center font-sans">
          <div className="w-20 h-20 bg-red-100 text-red-600 rounded-3xl flex items-center justify-center mb-8 shadow-lg">
            <AlertTriangle size={40} />
          </div>
          
          <h1 className="text-3xl font-black text-gray-900 uppercase tracking-tight mb-4">
            A Technical Problem Occurred
          </h1>
          
          <p className="text-gray-500 max-w-md mb-8 font-medium leading-relaxed">
            We encountered a glitch while processing your request. Don't worry, your payment was likely successful, but the website had trouble showing the confirmation page.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 w-full max-w-xs mb-10">
            <button
              onClick={() => window.location.reload()}
              className="flex-1 px-8 py-4 bg-gray-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-black transition-all shadow-xl flex items-center justify-center gap-3 active:scale-95"
            >
              <RefreshCw size={18} />
              Try Again
            </button>
            <button
              onClick={this.handleRestart}
              className="flex-1 px-8 py-4 bg-white text-gray-900 rounded-2xl font-black text-xs uppercase tracking-widest border border-gray-200 hover:bg-gray-50 transition-all flex items-center justify-center gap-3 active:scale-95"
            >
              <Home size={18} />
              Go Home
            </button>
          </div>

          {/* Diagnostic Tool */}
          <div className="w-full max-w-lg">
            <button 
              onClick={() => this.setState({ showDetails: !this.state.showDetails })}
              className="flex items-center gap-2 mx-auto text-[10px] font-black text-gray-400 uppercase tracking-widest hover:text-gray-600 transition-colors"
            >
              {this.state.showDetails ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              {this.state.showDetails ? 'Hide Error Details' : 'Show Technical Error Details'}
            </button>
            
            {this.state.showDetails && (
              <div className="mt-4 p-6 bg-gray-900 text-left rounded-3xl overflow-auto max-h-60 border border-white/10 shadow-2xl">
                <p className="text-green-400 font-mono text-xs mb-4"># Diagnostic Information</p>
                <p className="text-white font-mono text-xs break-all mb-2">
                  <strong>Error:</strong> {this.state.error?.toString()}
                </p>
                <p className="text-gray-500 font-mono text-[10px] uppercase tracking-widest mt-4">
                  Please share this text with support to help us fix it.
                </p>
              </div>
            )}
          </div>

          <div className="mt-12 text-gray-300 text-[10px] font-bold uppercase tracking-[4px]">
            Log ID: {Date.now().toString().slice(-6)}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
