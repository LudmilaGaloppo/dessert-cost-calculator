import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './styles.css';
import { UnsavedChangesProvider } from './components/UnsavedChanges';

const root = document.getElementById('root');
if (!root) throw new Error('No se encontró el contenedor de la aplicación.');

createRoot(root).render(
  <StrictMode>
    <UnsavedChangesProvider><App /></UnsavedChangesProvider>
  </StrictMode>,
);
