'use client'

import React from 'react'

interface ErrorBoundaryProps {
  children: React.ReactNode
  fallback?: React.ReactNode
}

interface ErrorBoundaryState {
  hasError: boolean
  error: Error | null
  errorInfo: React.ErrorInfo | null
}

class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null
    }
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo)
    console.error('Error stack:', error.stack)
    console.error('Component stack:', errorInfo.componentStack)
    console.error('Error name:', error.name)
    console.error('Error message:', error.message)
    this.setState({
      error,
      errorInfo
    })
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      return (
        <div className="min-h-screen bg-theme-bg flex items-center justify-center p-4">
          <div className="bg-theme-card border border-reject-border rounded-xl p-8 max-w-4xl w-full">
            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0">
                <svg
                  className="h-8 w-8 text-reject-text"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
              </div>
              <div className="flex-1">
                <h2 className="text-xl font-semibold text-white mb-2">
                  Something went wrong
                </h2>
                <p className="text-gray-400 mb-4">
                  An error occurred while rendering this page. Check the browser console and details below:
                </p>

                {this.state.error && (
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-sm font-medium text-reject-text mb-2">Error Type:</h3>
                      <div className="bg-theme-bg border border-theme-border rounded-lg p-4">
                        <code className="text-sm text-yellow-400 break-words">
                          {this.state.error.name}
                        </code>
                      </div>
                    </div>

                    <div>
                      <h3 className="text-sm font-medium text-reject-text mb-2">Error Message:</h3>
                      <div className="bg-theme-bg border border-theme-border rounded-lg p-4">
                        <code className="text-sm text-red-400 break-words">
                          {this.state.error.message}
                        </code>
                      </div>
                    </div>

                    {this.state.error.stack && (
                      <div>
                        <h3 className="text-sm font-medium text-reject-text mb-2">Stack Trace:</h3>
                        <div className="bg-theme-bg border border-theme-border rounded-lg p-4 max-h-64 overflow-auto">
                          <pre className="text-xs text-gray-300 whitespace-pre-wrap break-words font-mono">
                            {this.state.error.stack}
                          </pre>
                        </div>
                      </div>
                    )}

                    {this.state.errorInfo && this.state.errorInfo.componentStack && (
                      <div>
                        <h3 className="text-sm font-medium text-reject-text mb-2">Component Stack:</h3>
                        <div className="bg-theme-bg border border-theme-border rounded-lg p-4 max-h-64 overflow-auto">
                          <pre className="text-xs text-gray-300 whitespace-pre-wrap break-words font-mono">
                            {this.state.errorInfo.componentStack}
                          </pre>
                        </div>
                      </div>
                    )}

                    <div className="bg-yellow-900/20 border border-yellow-800 rounded-lg p-4">
                      <p className="text-sm text-yellow-200">
                        <strong>Debug Tip:</strong> Open the browser console (F12) for additional debugging information including detailed error logs.
                      </p>
                    </div>
                  </div>
                )}

                <div className="mt-6 flex space-x-3">
                  <button
                    onClick={() => window.location.reload()}
                    className="bg-theme-accent text-white px-4 py-2 rounded-lg hover:bg-theme-accent/80 transition-colors duration-200"
                  >
                    Reload Page
                  </button>
                  <button
                    onClick={() => window.history.back()}
                    className="bg-theme-card border border-theme-border text-gray-300 px-4 py-2 rounded-lg hover:bg-theme-bg transition-colors duration-200"
                  >
                    Go Back
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

export default ErrorBoundary
