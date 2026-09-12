type ToastType = 'info' | 'error' | 'success' | 'warning';

interface ToastEventDetail {
  message: string;
  type: ToastType;
}

declare global {
  interface WindowEventMap {
    'kurio:toast': CustomEvent<ToastEventDetail>;
  }
}

export function showToast(message: string, type: ToastType = 'info'): void {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('kurio:toast', { detail: { message, type } }));
  }
}