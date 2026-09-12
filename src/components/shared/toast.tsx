import { useState, useCallback, useEffect, useRef, ReactNode } from 'react';
import { ToastContext, type Toast } from '@/lib/toast-context';

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const nextId = useRef(0);

  const showToast = useCallback((message: string, type: Toast['type'] = 'info') => {
    const id = ++nextId.current;
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 5000);
  }, []);

  const dismissToast = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  useEffect(() => {
    const handleToast = (event: CustomEvent<{ message: string; type: Toast['type'] }>) => {
      showToast(event.detail.message, event.detail.type);
    };
    window.addEventListener('kurio:toast', handleToast as EventListener);
    return () => window.removeEventListener('kurio:toast', handleToast as EventListener);
  }, [showToast]);

  return (
    <ToastContext.Provider value={{ toasts, showToast, dismissToast }}>
      {children}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 md:bottom-6 md:right-6" aria-live="polite" aria-atomic="true">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`flex items-center gap-2 rounded-md border px-4 py-3 text-sm shadow-lg ${
              toast.type === 'error' ? 'border-kurio-accent bg-kurio-night text-kurio-cream' :
              toast.type === 'warning' ? 'border-kurio-flame bg-kurio-night text-kurio-cream' :
              toast.type === 'success' ? 'border-green-500 bg-kurio-night text-kurio-cream' :
              'border-kurio-line bg-kurio-surface text-kurio-cream'
            }`}
            role="alert"
          >
            <span className="flex-1">{toast.message}</span>
            <button
              onClick={() => dismissToast(toast.id)}
              className="flex-shrink-0 rounded-sm p-1 text-kurio-tan hover:text-kurio-cream focus-visible:ring-2 focus-visible:ring-kurio-accent"
              aria-label="Fechar notificação"
            >
              ×
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
