import { Outlet } from '@tanstack/react-router';
import { MobileBottomNav } from '@/components/shared/mobile-bottom-nav';
import { SiteFooter } from '@/components/shared/site-footer';
import { SiteHeader } from '@/components/shared/site-header';

export function RootLayout() {
  return (
    <div className="flex min-h-screen flex-col overflow-x-hidden bg-kurio-night font-display text-kurio-cream">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-kurio-flame focus:px-4 focus:py-2 focus:text-kurio-night"
      >
        Pular para o conteúdo
      </a>
      <SiteHeader />
      <main id="main-content" className="flex-1">
        <Outlet />
      </main>
      <SiteFooter />
      <MobileBottomNav />
    </div>
  );
}
