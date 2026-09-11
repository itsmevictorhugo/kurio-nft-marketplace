import { Button } from '@/components/ui/button';
import { ArrowRightIcon } from '@/components/shared/icons';
import { artwork } from '@/features/catalog/lib/artwork';

interface HomeBannersProps {
  onExplore: (category: string | undefined) => void;
}

const banners = [
  {
    id: 'banner-genesis',
    image: artwork.bannerGenesis,
    title: 'Lançamentos gênese de edição limitada',
    text: 'Coleccione edições raras diretamente dos criadores antes da revelação pública.',
    category: undefined,
  },
  {
    id: 'banner-digital-art',
    image: artwork.bannerDigital,
    title: 'Arte digital selecionadas e muito mais',
    text: 'Explore novos artistas, coleções verificadas e obras digitais que definem a cultura.',
    category: 'Digital Art',
  },
] as const;

export function HomeBanners({ onExplore }: HomeBannersProps) {
  return (
    <section aria-label="Coleções em destaque" className="mx-auto w-full max-w-[1200px] px-4 py-14 md:px-6">
      <div className="grid gap-6 md:grid-cols-2">
        {banners.map((banner) => (
          <article
            key={banner.id}
            className="flex overflow-hidden rounded-xl bg-kurio-surface md:min-h-[280px]"
          >
            <img
              src={banner.image}
              alt=""
              loading="lazy"
              className="hidden w-[42%] shrink-0 object-cover sm:block"
              aria-hidden="true"
            />
            <div className="flex min-w-0 flex-1 flex-col items-end justify-center p-6 text-right lg:p-8">
              <h2 className="font-display text-base font-bold leading-snug text-kurio-cream lg:text-lg">
                {banner.title}
              </h2>
              <p className="mt-3 text-xs leading-relaxed text-kurio-tan lg:text-sm">{banner.text}</p>
              <Button size="sm" className="mt-5" onClick={() => onExplore(banner.category)}>
                Explorar
                <ArrowRightIcon width={14} height={14} />
              </Button>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
