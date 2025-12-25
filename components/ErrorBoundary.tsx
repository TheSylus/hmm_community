import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangleIcon } from './Icons';

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
    };
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  private handleReload = () => {
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-900 p-4 text-center">
          <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-xl max-w-md w-full border border-gray-100 dark:border-gray-700">
            <div className="flex justify-center mb-6">
                <div className="p-4 bg-red-100 dark:bg-red-900/30 rounded-full">
                    <AlertTriangleIcon className="w-12 h-12 text-red-600 dark:text-red-400" />
                </div>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Ups, etwas ist schiefgelaufen.</h1>
            <p className="text-gray-600 dark:text-gray-400 mb-6 text-sm">
              Die App ist auf einen unerwarteten Fehler gestoßen. Wir haben dies protokolliert.
            </p>
            
            {/* Optional: Show error message in dev mode only, or simplified for user */}
            {this.state.error && (
                <div className="mb-6 p-3 bg-gray-100 dark:bg-gray-900 rounded text-xs text-left font-mono text-red-500 overflow-auto max-h-32">
                    {this.state.error.toString()}
                </div>
            )}

            <button
              onClick={this.handleReload}
              className="w-full py-3 px-6 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition-colors shadow-md"
            >
              App neu laden
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}