import { useState } from 'react';
import { Link, useLocation, useNavigate } from '@tanstack/react-router';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { CartIcon, SearchIcon, ChevronDownIcon, UserCircleIcon, LogOutIcon } from '@/components/shared/icons';
import { cartItemCount, useCart } from '@/features/cart/hooks/use-cart';
import { useSessionUser, logout } from '@/features/auth/session';

const inactiveSections = ['Mercado', 'Criadores', 'Aprenda'] as const;

function initials(name: string) {
  return name
    .split(' ')
    .map((part) => part[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

export function SiteHeader() {
  const location = useLocation();
  const navigate = useNavigate();
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);
  const isDetail = location.pathname.startsWith('/nfts/');
  const cart = useCart();
  const user = useSessionUser();
  const count = cartItemCount(cart.data);

  const updateSearch = (value: string) => {
    setSearchTerm(value);
    void navigate({
      to: '/',
      replace: true,
      search: (previous) => ({ ...previous, search: value.trim() || undefined, page: undefined }),
    });
  };

  const handleLogout = async () => {
    setMenuOpen(false);
    await logout();
  };

  return (
    <header className="hidden border-b border-kurio-line/60 md:block">
      <div className="mx-auto flex h-16 w-full max-w-[1200px] items-center justify-between px-6">
        <Link
          to="/"
          className="font-display text-sm font-bold tracking-[0.3em] text-kurio-cream outline-none transition-colors hover:text-kurio-accent focus-visible:ring-2 focus-visible:ring-kurio-accent"
        >
          KURIO
        </Link>

        <nav aria-label="Navegação principal" className="flex items-center gap-8">
          <Link
            to="/"
            activeOptions={{ exact: true }}
            className={navClass(isDetail ? false : true)}
          >
            Início
          </Link>
          {inactiveSections.map((section) => (
            <span
              key={section}
              aria-disabled="true"
              aria-current={section === 'Mercado' && isDetail ? 'page' : undefined}
              className={navClass(section === 'Mercado' && isDetail)}
            >
              {section}
            </span>
          ))}
        </nav>

        <div className="flex items-center gap-4">
          {searchOpen ? (
            <input
              autoFocus
              type="search"
              value={searchTerm}
              placeholder="Buscar NFTs..."
              aria-label="Buscar NFTs por nome, coleção ou criador"
              onChange={(event) => updateSearch(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Escape') {
                  setSearchOpen(false);
                }
              }}
              className="h-9 w-56 rounded-md border border-kurio-line bg-kurio-surface px-3 font-display text-sm text-kurio-cream placeholder:text-kurio-tan/60 outline-none focus-visible:ring-2 focus-visible:ring-kurio-accent"
            />
          ) : null}
          <Button
            variant="ghost"
            size="icon"
            aria-label={searchOpen ? 'Fechar busca' : 'Buscar NFTs'}
            onClick={() => setSearchOpen((open) => !open)}
            className="text-kurio-tan hover:text-kurio-cream"
          >
            <SearchIcon />
          </Button>
          <Link
            to="/cart"
            aria-label={`Carrinho de NFTs${count > 0 ? `, ${count} ${count === 1 ? 'item' : 'itens'}` : ''}`}
            className="relative rounded-sm p-2 text-kurio-tan outline-none transition-colors hover:text-kurio-accent focus-visible:ring-2 focus-visible:ring-kurio-accent"
          >
            <CartIcon />
            {count > 0 ? (
              <span
                className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-kurio-flame px-1 text-[10px] font-bold leading-none text-kurio-night"
                aria-hidden="true"
              >
                {count}
              </span>
            ) : null}
          </Link>
          {user ? (
            <div className="relative">
              <Button
                variant="ghost"
                size="icon"
                aria-label={`Menu do usuário ${user.displayName}`}
                aria-expanded={menuOpen}
                aria-haspopup="true"
                onClick={() => setMenuOpen((open) => !open)}
                className="relative h-9 w-9 rounded-full bg-kurio-flame/10 text-kurio-cream outline-none transition-colors hover:bg-kurio-flame/20 focus-visible:ring-2 focus-visible:ring-kurio-accent"
              >
                <span className="flex h-full w-full items-center justify-center rounded-full text-sm font-bold">
                  {initials(user.displayName)}
                </span>
                <ChevronDownIcon width={12} height={12} className="ml-1" />
              </Button>
              {menuOpen && (
                <div
                  className="absolute right-0 mt-2 w-44 origin-top-right rounded-md border border-kurio-line bg-kurio-surface shadow-lg ring-1 ring-kurio-line/20 focus-visible:outline-none animate-in fade-in-0 zoom-in-95 duration-100"
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
                    <UserCircleIcon width={16} height={16} />
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
              className="inline-flex h-9 items-center justify-center rounded-md bg-kurio-flame px-5 font-display text-[11px] font-bold uppercase tracking-wide text-kurio-night outline-none transition-colors hover:bg-kurio-accent focus-visible:ring-2 focus-visible:ring-kurio-accent focus-visible:ring-offset-2 focus-visible:ring-offset-kurio-night"
            >
              Entrar
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}

function navClass(isActive: boolean) {
  return cn(
    'cursor-default rounded-sm border-b-2 px-1 pb-1 font-display text-xs font-bold tracking-wide',
    isActive ? 'border-kurio-accent text-kurio-accent' : 'border-transparent text-kurio-cream',
  );
}
