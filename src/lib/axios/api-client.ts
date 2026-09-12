import axios from 'axios';
import { clearSessionToken } from '@/features/auth/session';
import { router } from '@/app/router/router';
import { showToast } from '@/lib/toast-events';

export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? '/api',
  headers: {
    Accept: 'application/json',
  },
});

let isHandling401 = false;

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const status = error?.response?.status;
    if (status === 401 && !isHandling401) {
      isHandling401 = true;
      try {
        clearSessionToken();
        showToast('Sua sessão expirou. Faça login novamente.', 'warning');
        const currentPath = router.state.location.pathname;
        const internalRedirect = currentPath.startsWith('/checkout') || currentPath.startsWith('/order/')
          ? currentPath
          : undefined;
        void router.navigate({
          to: '/login',
          search: internalRedirect ? { redirect: internalRedirect } : undefined,
          replace: true,
        });
      } finally {
        isHandling401 = false;
      }
    }
    return Promise.reject(error);
  },
);
