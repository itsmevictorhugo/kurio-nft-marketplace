import { artwork } from '@/features/catalog/lib/artwork';
import { ArrowRightIcon } from '@/components/shared/icons';

const articles = [
  {
    id: 'article-1',
    image: artwork.editorial[0],
    date: '12 de outubro',
    readingTime: 'Leitura de 4 min',
    title: 'Como funciona a propriedade de NFTs',
    excerpt: 'Entenda o que significa possuir um ativo digital.',
  },
  {
    id: 'article-2',
    image: artwork.editorial[1],
    date: '13 de setembro',
    readingTime: 'Leitura de 6 min',
    title: '10 artistas digitais para acompanhar',
    excerpt: 'Conheça as mentores que moldam a cultura digital.',
  },
  {
    id: 'article-3',
    image: artwork.editorial[2],
    date: '15 de setembro',
    readingTime: 'Leitura de 5 min',
    title: 'Raridade, utilidade e procedência',
    excerpt: 'O que observar nos atributos antes de colecionar.',
  },
  {
    id: 'article-4',
    image: artwork.editorial[3],
    date: '17 de outubro',
    readingTime: 'Leitura de 7 min',
    title: 'Como proteger sua carteira',
    excerpt: 'Práticas essenciais para manter ativos e identidade.',
  },
] as const;

export function HomeEditorial() {
  return (
    <section aria-labelledby="editorial-heading" className="mx-auto w-full max-w-[1200px] px-4 pb-16 md:px-6">
      <div className="text-center">
        <h2 id="editorial-heading" className="font-display text-2xl font-bold text-kurio-cream">
          Diário da Cunhagem
        </h2>
        <p className="mt-2 text-xs text-kurio-tan">
          Histórias, guias e insights para colecionadores sobre o universo da propriedade digital.
        </p>
      </div>

      <ul className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {articles.map((article) => (
          <li key={article.id}>
            <article className="flex h-full flex-col overflow-hidden rounded-xl bg-kurio-surface">
              <img
                src={article.image}
                alt=""
                loading="lazy"
                className="aspect-[4/3] w-full object-cover"
                aria-hidden="true"
              />
              <div className="flex flex-1 flex-col p-4">
                <p className="text-[10px] text-kurio-tan/80">
                  {article.date} | {article.readingTime}
                </p>
                <h3 className="mt-2 font-display text-sm font-bold leading-snug text-kurio-cream">
                  {article.title}
                </h3>
                <p className="mt-2 flex-1 text-xs leading-relaxed text-kurio-tan">{article.excerpt}</p>
                <p className="mt-3 flex items-center gap-1.5 text-xs font-bold text-kurio-accent" aria-hidden="true">
                  Ler mais
                  <ArrowRightIcon width={12} height={12} />
                </p>
              </div>
            </article>
          </li>
        ))}
      </ul>
    </section>
  );
}
