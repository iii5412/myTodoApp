import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './index.css';
import { applyPendingLiveBundle, startLiveUpdates } from './lib/liveUpdate';

async function boot() {
  // A downloaded screen bundle is switched in before anything renders.
  if (await applyPendingLiveBundle()) return;

  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <App />
    </StrictMode>,
  );
  startLiveUpdates();
}

void boot();
