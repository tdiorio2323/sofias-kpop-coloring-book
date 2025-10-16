"use client"

import React from "react"
import { AlertTriangle, RefreshCw, Home } from "lucide-react"

interface ErrorBoundaryProps {
  children: React.ReactNode
  fallback?: React.ReactNode
}

interface ErrorBoundaryState {
  hasError: boolean
  error: Error | null
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("ErrorBoundary caught error:", error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      return (
        <div className="min-h-screen cosmic-background flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-card rounded-3xl border-4 border-destructive p-8 shadow-2xl animate-in zoom-in duration-300">
            <div className="flex flex-col items-center text-center">
              <div className="w-20 h-20 bg-destructive/20 rounded-full flex items-center justify-center mb-6">
                <AlertTriangle className="w-12 h-12 text-destructive" />
              </div>
              
              <h2 className="text-3xl font-bold text-foreground mb-4">
                Oops! Something went wrong
              </h2>
              
              <p className="text-muted-foreground mb-2">
                Don't worry, your artwork is still saved!
              </p>
              
              {this.state.error && (
                <details className="mt-4 mb-6 w-full">
                  <summary className="text-sm text-muted-foreground cursor-pointer hover:text-foreground">
                    Technical details
                  </summary>
                  <pre className="mt-2 p-3 bg-muted rounded-lg text-xs overflow-auto max-h-40">
                    {this.state.error.message}
                  </pre>
                </details>
              )}
              
              <div className="flex gap-3 w-full">
                <button
                  onClick={() => window.location.href = '/'}
                  className="flex-1 flex items-center justify-center gap-2 bg-primary hover:bg-primary/80 text-primary-foreground py-4 rounded-full font-bold transition-all hover:scale-105 active:scale-95"
                >
                  <Home className="w-5 h-5" />
                  Go Home
                </button>
                
                <button
                  onClick={() => window.location.reload()}
                  className="flex-1 flex items-center justify-center gap-2 bg-accent hover:bg-accent/80 text-accent-foreground py-4 rounded-full font-bold transition-all hover:scale-105 active:scale-95"
                >
                  <RefreshCw className="w-5 h-5" />
                  Reload
                </button>
              </div>
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

