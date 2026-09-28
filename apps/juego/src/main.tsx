import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';
import { ProveedorEstado } from './estado';
import { BackendHttp } from './api/http';
import { BackendLocal } from './api/local';
import './estilos.css';

// Modo demo (un solo HTML, sin servidor) o modo clase (con el servidor del colegio).
// En modo clase también se puede forzar la práctica con ?practica
const practica = __MODO_DEMO__ || new URLSearchParams(window.location.search).has('practica');
const backend = practica ? new BackendLocal() : new BackendHttp();

createRoot(document.getElementById('raiz') as HTMLElement).render(
  <StrictMode>
    <ProveedorEstado backend={backend}>
      <App />
    </ProveedorEstado>
  </StrictMode>,
);

// Funciona sin conexión una vez cargado (solo en modo clase, con servidor).
if (!__MODO_DEMO__ && 'serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => undefined);
  });
}
