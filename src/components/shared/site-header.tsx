import { useState } from 'react';
import { Link, useLocation, useNavigate } from '@tanstack/react-router';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { CartIcon, SearchIcon } from '@/components/shared/icons';
import { cartItemCount, useCart } from '@/features/cart/hooks/use-cart';

const inactiveSections = ['Mercado', 'Criadores', 'Aprenda'] as const;

export function SiteHeader() {
  const location = useLocation();
  const navigate = useNavigate();
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const isDetail = location.pathname.startsWith('/nfts/');
  const cart = useCart();
  const count = cartItemCount(cart.data);

  const updateSearch = (value: string) => {
    setSearchTerm(value);
    void navigate({
      to: '/',
      replace: true,
      search: (previous) => ({ ...previous, search: value.trim() || undefined, page: undefined }),
    });
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
          <Link
            to="/login"
            className="inline-flex h-9 items-center justify-center rounded-md bg-kurio-flame px-5 font-display text-[11px] font-bold uppercase tracking-wide text-kurio-night outline-none transition-colors hover:bg-kurio-accent focus-visible:ring-2 focus-visible:ring-kurio-accent focus-visible:ring-offset-2 focus-visible:ring-offset-kurio-night"
          >
            Entrar
          </Link>
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
