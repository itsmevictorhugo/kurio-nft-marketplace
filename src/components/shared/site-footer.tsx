import { Fragment } from 'react';
import { cn } from '@/lib/utils';
import {
  FacebookIcon,
  InstagramIcon,
  LinkedInIcon,
  XIcon,
  YouTubeIcon,
} from '@/components/shared/icons';

const featureColumns = [
  {
    letter: 'W',
    title: 'Segurança da carteira',
    text: 'Proteja sua carteira e colecione arte digital verificada com confiança.',
  },
  {
    letter: 'C',
    title: 'Criadores em destaque',
    text: 'Conheça artistas, estúdios e comunidades que moldam a cultura digital na rede.',
  },
  {
    letter: 'D',
    title: 'Alertas de lançamentos',
    text: 'Receba calendários de cunhagem, novidades de listas de acesso e análises do mercado.',
  },
] as const;

const linkColumns = [
  {
    title: 'Meu perfil',
    items: [
      'Meu perfil',
      'Minha coleção',
      'Atividade',
      'Estúdio do criador',
      'Lista de interesse',
    ],
  },
  {
    title: 'Central de ajuda',
    items: [
      'Central de ajuda',
      'Como comprar NFTs',
      'Carteira e segurança',
      'Política do mercado',
      'Denunciar item',
    ],
  },
  {
    title: 'Coleções',
    items: ['Arte digital', 'Fotografia', 'Música', 'Arte 3D', 'Utilidade'],
  },
] as const;

const socialNetworks = [
  { label: 'Facebook', Icon: FacebookIcon },
  { label: 'Instagram', Icon: InstagramIcon },
  { label: 'X (Twitter)', Icon: XIcon },
  { label: 'LinkedIn', Icon: LinkedInIcon },
  { label: 'YouTube', Icon: YouTubeIcon },
] as const;

const walletNames = ['MetaMask', 'WalletConnect', 'Coinbase'] as const;

interface SiteFooterProps {
  className?: string;
}

export function SiteFooter({ className }: SiteFooterProps) {
  return (
    <footer className={cn('bg-kurio-night pb-24 md:pb-0', className)}>
      <div className="mx-auto w-full max-w-[1200px] px-4 pb-10 pt-14 md:px-6">
        <div className="overflow-hidden rounded-2xl bg-kurio-surface">
          <div className="grid gap-10 px-6 py-10 sm:grid-cols-2 lg:grid-cols-4 lg:gap-0 lg:divide-x lg:divide-kurio-line/60 lg:px-8">
            {featureColumns.map((column) => (
              <section
                key={column.title}
                className="lg:px-7 lg:first:pl-2 lg:last:pr-2"
              >
                <div
                  aria-hidden="true"
                  className="flex h-14 w-14 items-center justify-center rounded-full bg-kurio-flame font-display text-xl font-bold text-kurio-night"
                >
                  {column.letter}
                </div>
                <h3 className="mt-5 font-display text-base font-bold text-kurio-cream">
                  {column.title}
                </h3>
                <p className="mt-3 text-sm leading-relaxed text-kurio-tan">
                  {column.text}
                </p>
              </section>
            ))}

            <section aria-label="Receba novidades da Kurio" className="lg:px-7">
              <h3 className="font-display text-base font-bold leading-snug text-kurio-cream">
                Antecipe-se ao próximo lançamento
              </h3>
              <form
                className="mt-4 flex"
                onSubmit={(event) => event.preventDefault()}
              >
                <label htmlFor="newsletter-email" className="sr-only">
                  Digite seu e-mail
                </label>
                <input
                  id="newsletter-email"
                  name="email"
                  type="email"
                  placeholder="digite seu e-mail..."
                  className="h-11 w-full min-w-0 rounded-l-md bg-[#38220F] px-2 font-display text-xs text-kurio-cream placeholder:text-[10px] placeholder:text-kurio-tan/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-kurio-accent"
                />
                <button
                  type="submit"
                  className="h-11 shrink-0 rounded-r-md bg-kurio-flame px-3 font-display text-xs font-bold text-kurio-night outline-none transition-colors hover:bg-kurio-accent focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-kurio-accent"
                >
                  Enviar
                </button>
              </form>
              <p className="mt-4 text-sm leading-relaxed text-kurio-tan">
                Receba lançamentos selecionados, histórias de criadores e
                novidades do mercado.
              </p>
            </section>
          </div>

          <div className="grid items-center gap-4 bg-[#38220F] px-6 py-6 text-sm text-kurio-cream sm:grid-cols-2 lg:grid-cols-4 lg:px-8">
            <span className="font-display text-sm font-bold tracking-[0.3em] text-kurio-cream">
              KURIO
            </span>
            <p>
              Feito para colecionadores,
              <br className="hidden lg:block" /> criadores e cultura
            </p>
            <p>contato@email.com</p>
            <p className="lg:text-right">+55 11 4002 8922</p>
          </div>

          <div className="grid gap-10 px-6 py-10 sm:grid-cols-2 lg:grid-cols-4 lg:px-8">
            {linkColumns.map((column) => (
              <section key={column.title}>
                <h3 className="font-display text-lg font-bold text-kurio-cream">
                  {column.title}
                </h3>
                <ul className="mt-4 space-y-3">
                  {column.items.map((item) => (
                    <li
                      key={item}
                      aria-disabled="true"
                      className="cursor-default text-sm text-kurio-cream"
                    >
                      {item}
                    </li>
                  ))}
                </ul>
              </section>
            ))}

            <section>
              <h3 className="font-display text-lg font-bold text-kurio-cream">
                Redes sociais
              </h3>
              <div className="mt-4 flex gap-2">
                {socialNetworks.map(({ label, Icon }) => (
                  <span
                    key={label}
                    role="img"
                    aria-label={label}
                    className="flex h-9 w-9 items-center justify-center rounded-md border border-kurio-flame/70 text-kurio-flame"
                  >
                    <Icon width={16} height={16} />
                  </span>
                ))}
              </div>
              <h3 className="mt-8 font-display text-lg font-bold text-kurio-cream">
                Carteiras compatíveis
              </h3>
              <div className="mt-3 flex items-center justify-center gap-1.5 overflow-x-auto whitespace-nowrap rounded-md border border-kurio-flame/40 bg-[#38220F] px-2 py-2.5">
                {walletNames.map((wallet, index) => (
                  <Fragment key={wallet}>
                    {index > 0 ? (
                      <span
                        aria-hidden="true"
                        className="text-[10px] text-kurio-flame/80"
                      >
                        •
                      </span>
                    ) : null}
                    <span className="font-display text-[10px] font-bold uppercase text-kurio-flame">
                      {wallet}
                    </span>
                  </Fragment>
                ))}
              </div>
            </section>
          </div>
        </div>

        <p className="mt-8 text-center text-sm text-kurio-cream">
          © 2026 Kurio. Propriedade digital para todos.
        </p>
      </div>
    </footer>
  );
}
