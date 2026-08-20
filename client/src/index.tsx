import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { ErrorBoundary } from 'react-error-boundary';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import RoutesComponent from './app.tsx';
import './index.css';
import { createPortal } from 'react-dom';
import { Toaster } from '@client/src/components/ui/sonner';

const CLIENT_BASE_PATH = import.meta.env.VITE_CLIENT_BASE_PATH || '/';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

const ErrorFallback = ({ error, resetErrorBoundary }: { error: Error; resetErrorBoundary: () => void }) => (
  <div style={{ padding: '40px', textAlign: 'center', fontFamily: 'sans-serif' }}>
    <h2>Something went wrong</h2>
    <pre style={{ color: '#666', whiteSpace: 'pre-wrap', margin: '16px 0' }}>{error.message}</pre>
    <button onClick={resetErrorBoundary} style={{ padding: '8px 16px', cursor: 'pointer' }}>
      Try Again
    </button>
  </div>
);

const MainApp = () => {
  return (
    <BrowserRouter basename={CLIENT_BASE_PATH}>
      <QueryClientProvider client={queryClient}>
        <ErrorBoundary FallbackComponent={ErrorFallback}>
          <RoutesComponent />
          {createPortal(<Toaster />, document.body)}
        </ErrorBoundary>
      </QueryClientProvider>
    </BrowserRouter>
  );
};

createRoot(document.getElementById('root')!).render(<MainApp />);
