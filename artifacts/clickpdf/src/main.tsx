import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { registerServiceWorker } from './pwaRegister';

// Register service worker for installable PWA with strict online network enforcement
registerServiceWorker();

createRoot(document.getElementById('root')!).render(<App />);
