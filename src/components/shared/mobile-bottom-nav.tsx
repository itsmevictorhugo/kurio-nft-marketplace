import { Link, useMatchRoute } from '@tanstack/react-router';
import { cn } from '@/lib/utils';
import { CartIcon, HeartIcon, HomeIcon, UserIcon } from '@/components/shared/icons';

export function MobileBottomNav() {
  const matchRoute = useMatchRoute();
  const isHome = matchRoute({ to: '/', fuzzy: false }) ?? false;

  const itemClass =
    'flex h-14 w-16 items-center justify-center rounded-sm outline-none focus-visible:ring-2 focus-visible:ring-kurio-accent';

  return (
    <nav
      aria-label="Navegação do aplicativo"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-kurio-line/60 bg-kurio-surface md:hidden"
    >
      <div className="mx-auto flex max-w-md items-center justify-around px-4">
        <Link to="/" aria-label="Início" aria-current={isHome ? 'page' : undefined} className={cn(itemClass, isHome ? 'text-kurio-accent' : 'text-kurio-tan')}>
          <HomeIcon />
        </Link>
        <button
          type="button"
          aria-label="Favoritos (indisponível nesta versão)"
          disabled
          className={cn(itemClass, 'text-kurio-tan/50')}
        >
          <HeartIcon />
        </button>
        <div className="relative w-16" aria-hidden="true">
          <div className="absolute -top-6 left-1/2 h-14 w-14 -translate-x-1/2 rounded-full border-4 border-kurio-night bg-kurio-flame/90" />
        </div>
        <Link to="/cart" aria-label="Carrinho" className={cn(itemClass, 'text-kurio-tan')}>
          <CartIcon />
        </Link>
        <Link to="/profile" aria-label="Perfil" className={cn(itemClass, 'text-kurio-tan')}>
          <UserIcon />
        </Link>
      </div>
    </nav>
  );
}
