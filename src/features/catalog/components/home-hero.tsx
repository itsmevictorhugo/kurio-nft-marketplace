import { Button } from '@/components/ui/button';
import { ArrowRightIcon } from '@/components/shared/icons';
import { artwork } from '@/features/catalog/lib/artwork';

function scrollToCatalog() {
  document
    .getElementById('catalogo')
    ?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

export function HomeHero() {
  return (
    <section
      aria-label="Apresentação da Kurio"
      className="mx-auto w-full max-w-[1200px] px-4 pt-6 md:px-6 md:pt-16"
    >
      {/* Mobile composition (Figma mobile frame) */}
      <div className="overflow-hidden rounded-2xl bg-gradient-to-br from-[#5C341C] via-kurio-surface to-kurio-night md:hidden">
        <div className="flex items-start justify-between gap-4 p-5">
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-bold text-kurio-cream/80">
              Bem-vindo à Kurio
            </p>
            <h1 className="mt-2 font-display text-xl font-bold uppercase leading-snug tracking-wide text-kurio-cream">
              Seja dono da cultura digital
            </h1>
          </div>
          <div className="relative shrink-0">
            <img
              src={artwork.hero}
              alt=""
              className="h-24 w-24 rounded-xl object-cover"
              aria-hidden="true"
            />
            <img
              src={artwork.heroOverlay}
              alt=""
              className="absolute -bottom-3 -left-4 h-12 w-12 rounded-lg object-cover"
              aria-hidden="true"
            />
          </div>
        </div>
        <div className="px-5 pb-5">
          <p className="text-xs leading-relaxed text-kurio-cream/80">
            Descubra NFTs selecionados de criadores do mundo todo.
          </p>
          <button
            type="button"
            onClick={scrollToCatalog}
            className="mt-4 inline-flex items-center gap-2 rounded-sm font-display text-base font-bold uppercase tracking-wide text-kurio-flame outline-none transition-colors hover:text-kurio-accent focus-visible:ring-2 focus-visible:ring-kurio-accent"
          >
            Explorar
            <ArrowRightIcon width={18} height={18} />
          </button>
          <div className="mt-5 flex justify-center gap-2" aria-hidden="true">
            <span className="h-1.5 w-1.5 rounded-full bg-kurio-flame" />
            <span className="h-1.5 w-1.5 rounded-full bg-kurio-cream/40" />
            <span className="h-1.5 w-1.5 rounded-full bg-kurio-cream/40" />
          </div>
        </div>
      </div>

      {/* Desktop composition (Figma desktop frame) */}
      <div className="hidden md:block">
        <div className="grid items-center gap-16 md:grid-cols-[1.15fr_1fr]">
          <div>
            <p className="text-sm font-bold text-kurio-cream">
              Bem-vindo à Kurio
            </p>
            <h1 className="mt-5 max-w-[560px] font-display text-[2.75rem] font-bold uppercase leading-[1.3] text-kurio-cream">
              Seja dono do futuro da arte digital
            </h1>
            <p className="mt-6 max-w-[560px] text-sm leading-relaxed text-kurio-tan">
              Descubra NFTs selecionados de criadores emergentes e consagrados.
              Coleccione arte digital rara, apoie artistas e tenha uma parte da
              cultura da internet.
            </p>
            <div className="mt-9">
              <Button onClick={scrollToCatalog}>Explorar</Button>
            </div>
            <div
              className="mt-12 flex justify-end gap-2.5 pr-10"
              aria-hidden="true"
            >
              <span className="h-2 w-2 rounded-full bg-kurio-flame" />
              <span className="h-2 w-2 rounded-full bg-kurio-flame/50" />
              <span className="h-2 w-2 rounded-full bg-kurio-flame/50" />
            </div>
          </div>

          <div className="relative">
            <img
              src={artwork.hero}
              alt=""
              className="aspect-square w-full rounded-2xl object-cover"
              aria-hidden="true"
            />
            <img
              src={artwork.heroOverlay}
              alt=""
              className="absolute bottom-8 left-8 h-32 w-32 rounded-xl object-cover"
              aria-hidden="true"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
