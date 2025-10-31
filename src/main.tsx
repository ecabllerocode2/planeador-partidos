// src/main.tsx

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { BrowserRouter } from 'react-router-dom'; // 👈 Importamos BrowserRouter

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {/* 👈 Envolvemos App con BrowserRouter para habilitar el routing */}
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>,
)