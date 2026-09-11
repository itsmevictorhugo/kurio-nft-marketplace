import { Button } from '@/components/ui/button';
import { ArrowRightIcon } from '@/components/shared/icons';

interface CatalogEmptyProps {
  onClearFilters: () => void;
}

export function CatalogEmpty({ onClearFilters }: CatalogEmptyProps) {
  return (
    <div
      role="status"
      className="flex flex-col items-center gap-4 rounded-xl border border-dashed border-kurio-line px-6 py-16 text-center"
    >
      <p className="font-display text-sm font-bold text-kurio-cream">
        Nenhum NFT encontrado para os critérios atuais.
      </p>
      <p className="max-w-sm text-xs leading-relaxed text-kurio-tan">
        Tente ajustar a busca ou remover filtros para ver mais obras do acervo Kurio.
      </p>
      <Button variant="outline" onClick={onClearFilters}>
        Limpar filtros
      </Button>
    </div>
  );
}

interface CatalogErrorProps {
  onRetry: () => void;
}

export function CatalogError({ onRetry }: CatalogErrorProps) {
  return (
    <div
      role="alert"
      className="flex flex-col items-center gap-4 rounded-xl border border-kurio-line bg-kurio-surface px-6 py-16 text-center"
    >
      <p className="font-display text-sm font-bold text-kurio-cream">
        Não foi possível carregar o catálogo.
      </p>
      <p className="max-w-sm text-xs leading-relaxed text-kurio-tan">
        Ocorreu uma falha inesperada ao consultar o mercado. Seus critérios de busca foram mantidos.
      </p>
      <Button onClick={onRetry}>
        Tentar novamente
        <ArrowRightIcon width={16} height={16} />
      </Button>
    </div>
  );
}
