'use client';

import React, { Component, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-panda-green-50 to-panda-bamboo-50">
          <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md mx-4">
            <div className="text-6xl text-center mb-4">🐼</div>
            <h2 className="text-2xl font-bold text-center mb-4 text-gray-900">
              Oops! Something went wrong
            </h2>
            <p className="text-gray-600 text-center mb-6">
              The panda is working on fixing this issue. Please refresh the page to try again.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="w-full bg-panda-green-600 hover:bg-panda-green-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
            >
              Refresh Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
