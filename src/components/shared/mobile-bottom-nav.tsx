import { Link, useMatchRoute } from '@tanstack/react-router';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  CartIcon,
  HeartIcon,
  HomeIcon,
  UserIcon,
  LogOutIcon,
  ChevronDownIcon,
} from '@/components/shared/icons';
import { cartItemCount, useCart } from '@/features/cart/hooks/use-cart';
import { useSessionUser } from '@/features/auth/hooks/use-session';
import { logout } from '@/features/auth/session';

export function MobileBottomNav() {
  const matchRoute = useMatchRoute();
  const isHome = matchRoute({ to: '/', fuzzy: false }) ?? false;
  const cart = useCart();
  const user = useSessionUser();
  const count = cartItemCount(cart.data);
  const [menuOpen, setMenuOpen] = useState(false);

  const itemClass =
    'flex h-14 w-16 items-center justify-center rounded-sm outline-none focus-visible:ring-2 focus-visible:ring-kurio-accent';

  const handleLogout = async () => {
    setMenuOpen(false);
    await logout();
  };

  return (
    <header>
      <nav
        aria-label="Navegação do aplicativo"
        className="fixed inset-x-0 bottom-0 z-40 border-t border-kurio-line/60 bg-kurio-surface md:hidden"
      >
        <div className="mx-auto flex max-w-md items-center justify-around px-4">
          <Link
            to="/"
            aria-label="Início"
            aria-current={isHome ? 'page' : undefined}
            className={cn(
              itemClass,
              isHome ? 'text-kurio-accent' : 'text-kurio-tan',
            )}
          >
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

          <Link
            to="/cart"
            aria-label={`Carrinho${
              count > 0 ? `, ${count} ${count === 1 ? 'item' : 'itens'}` : ''
            }`}
            className={cn(itemClass, 'relative text-kurio-tan')}
          >
            <CartIcon />

            {count > 0 ? (
              <span
                className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-kurio-flame px-1 text-[10px] font-bold leading-none text-kurio-night"
                aria-hidden="true"
              >
                {count}
              </span>
            ) : null}
          </Link>

          {user ? (
            <div className="relative w-16">
              <Button
                variant="ghost"
                size="icon"
                aria-label={`Menu do usuário ${user.displayName}`}
                aria-expanded={menuOpen}
                aria-haspopup="true"
                onClick={() => setMenuOpen((open) => !open)}
                className={cn(itemClass, 'relative text-kurio-tan')}
              >
                <UserIcon />
                <ChevronDownIcon width={12} height={12} className="ml-1" />
              </Button>

              {menuOpen && (
                <div
                  className="absolute bottom-full right-0 mb-2 w-40 origin-bottom-right rounded-md border border-kurio-line bg-kurio-surface shadow-lg ring-1 ring-kurio-line/20 focus-visible:outline-none animate-in fade-in-0 zoom-in-95 duration-100"
                  role="menu"
                  aria-orientation="vertical"
                >
                  <Link
                    to="/profile"
                    role="menuitem"
                    tabIndex={-1}
                    className="flex w-full items-center gap-2 rounded-sm px-3 py-2 text-sm text-kurio-cream outline-none hover:bg-kurio-flame/10 focus:bg-kurio-flame/10"
                    onClick={() => setMenuOpen(false)}
                  >
                    <UserIcon width={16} height={16} />
                    Perfil
                  </Link>

                  <button
                    type="button"
                    role="menuitem"
                    tabIndex={-1}
                    className="flex w-full items-center gap-2 rounded-sm px-3 py-2 text-sm text-kurio-accent outline-none hover:bg-kurio-flame/10 focus:bg-kurio-flame/10"
                    onClick={handleLogout}
                  >
                    <LogOutIcon width={16} height={16} />
                    Sair
                  </button>
                </div>
              )}
            </div>
          ) : (
            <Link
              to="/login"
              aria-label="Entrar"
              className={cn(itemClass, 'text-kurio-tan')}
            >
              <UserIcon />
            </Link>
          )}
        </div>
      </nav>
    </header>
  );
}
