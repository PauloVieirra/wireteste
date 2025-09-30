import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { ToastProvider } from './components/ToastProvider.tsx'; // Importar ToastProvider
import { LoadingProvider } from './components/GlobalLoading.tsx'; // Importar LoadingProvider

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <LoadingProvider>
      <ToastProvider>
        <App />
      </ToastProvider>
    </LoadingProvider>
  </React.StrictMode>,
)