import React from 'react'
import ReactDOM from 'react-dom/client'
import '@renderer/styles/global.css'
import { LauncherApp } from './LauncherApp'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <LauncherApp />
  </React.StrictMode>,
)
