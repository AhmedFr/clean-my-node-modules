import { Component, type ErrorInfo, type ReactNode } from 'react'
import type { ErrorBoundaryProps, ErrorBoundaryState } from './ErrorBoundary.types'

/**
 * Root error boundary. A render error anywhere below it would otherwise leave a
 * blank window with no signal; instead we show a readable fallback and log the
 * error (with component stack) so it is diagnosable rather than silent.
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { error: null }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error('[ErrorBoundary] render error:', error, info.componentStack)
  }

  render(): ReactNode {
    const { error } = this.state
    if (!error) return this.props.children
    return (
      <div
        style={{
          margin: 16,
          padding: '16px 18px',
          borderRadius: 12,
          background: 'rgba(22,22,25,0.92)',
          color: '#f2f2f4',
          fontFamily: 'system-ui, -apple-system, sans-serif',
          fontSize: 13,
          lineHeight: 1.5,
        }}
      >
        <div style={{ fontWeight: 650, marginBottom: 6 }}>Something went wrong</div>
        <div style={{ opacity: 0.75, whiteSpace: 'pre-wrap', fontFamily: 'var(--mono-font, monospace)' }}>
          {error.message}
        </div>
      </div>
    )
  }
}
