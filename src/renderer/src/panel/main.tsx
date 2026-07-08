import { ErrorBoundary } from '@renderer/components/ErrorBoundary'
import React from 'react'
import ReactDOM from 'react-dom/client'
import '@renderer/styles/global.css'
import { PanelApp } from './PanelApp'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ErrorBoundary>
      <PanelApp />
    </ErrorBoundary>
  </React.StrictMode>,
)
