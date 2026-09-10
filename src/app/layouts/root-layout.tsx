import { Link, Outlet } from '@tanstack/react-router';

const navigation = [
  { to: '/', label: 'Home' },
  { to: '/cart', label: 'Cart' },
  { to: '/login', label: 'Login' },
] as const;

export function RootLayout() {
  return (
    <div className="min-h-screen overflow-x-hidden bg-slate-950 text-slate-100">
      <header className="border-b border-slate-800 px-4 py-4">
        <nav aria-label="Foundation navigation" className="mx-auto flex max-w-6xl gap-4">
          {navigation.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className="rounded-sm text-sm font-medium text-slate-100 outline-none transition-colors focus-visible:ring-2 focus-visible:ring-cyan-300 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950"
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </header>
      <main id="main-content" className="mx-auto w-full max-w-6xl px-4 py-12">
        <Outlet />
      </main>
    </div>
  );
}
