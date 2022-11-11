import { createRoot } from 'react-dom/client';
import App from './App';
import './App.css';
import '@fontsource/figtree';

const container = document.getElementById('root')!;
const root = createRoot(container);
root.render(<App />);
