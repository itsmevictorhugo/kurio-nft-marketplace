import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { AppProviders } from '@/app/providers/app-providers';
import { enableMocking } from '@/mocks/browser';
import '@/styles/globals.css';

async function bootstrap() {
  if (import.meta.env.VITE_ENABLE_MSW !== 'false') {
    await enableMocking();
  }

  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <AppProviders />
    </StrictMode>,
  );
}

void bootstrap();
