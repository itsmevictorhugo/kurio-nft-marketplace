import { useState } from 'react';
import { cn } from '@/lib/utils';
import type { Nft } from '@/types/domain';

interface DetailTabsProps {
  nft: Nft;
}

const networkLabels: Record<string, string> = {
  ethereum: 'Ethereum',
  polygon: 'Polygon',
  solana: 'Solana',
};

function formatContract(address: string) {
  if (!address.startsWith('0x') || address.length < 10) {
    return address;
  }
  return `0x${address.slice(2, 6)}…${address.slice(-4)}`;
}

function editionPhrase(nft: Nft) {
  const numbered = nft.editions.find((edition) => edition.total !== undefined);
  if (!numbered) {
    return 'de edição aberta';
  }
  return `digital ${numbered.editionNumber ?? 1}/${numbered.total}`;
}

export function DetailTabs({ nft }: DetailTabsProps) {
  const [activeTab, setActiveTab] = useState<'details' | 'reviews'>('details');
  const networkLabel = networkLabels[nft.network] ?? nft.network;

  return (
    <section aria-label="Detalhes e avaliações" className="mt-16">
      <div role="tablist" aria-label="Seções do NFT" className="flex gap-8 border-b border-kurio-line/60">
        <button
          role="tab"
          id="tab-details"
          aria-selected={activeTab === 'details'}
          aria-controls="panel-details"
          onClick={() => setActiveTab('details')}
          className={cn(
            'rounded-sm border-b-2 px-1 pb-3 font-display text-sm font-bold outline-none transition-colors focus-visible:ring-2 focus-visible:ring-kurio-accent',
            activeTab === 'details'
              ? 'border-kurio-accent text-kurio-accent'
              : 'border-transparent text-kurio-cream hover:text-kurio-accent',
          )}
        >
          Detalhes do NFT
        </button>
        <button
          role="tab"
          id="tab-reviews"
          aria-selected={activeTab === 'reviews'}
          aria-controls="panel-reviews"
          onClick={() => setActiveTab('reviews')}
          className={cn(
            'rounded-sm border-b-2 px-1 pb-3 font-display text-sm font-bold outline-none transition-colors focus-visible:ring-2 focus-visible:ring-kurio-accent',
            activeTab === 'reviews'
              ? 'border-kurio-accent text-kurio-accent'
              : 'border-transparent text-kurio-cream hover:text-kurio-accent',
          )}
        >
          Avaliações de colecionadores (19)
        </button>
      </div>

      {activeTab === 'details' ? (
        <div role="tabpanel" id="panel-details" aria-labelledby="tab-details" className="mt-8 grid gap-10 lg:grid-cols-[1.4fr_1fr]">
          <div className="space-y-4 text-sm leading-relaxed text-kurio-tan">
            <p>
              {nft.name} é uma obra {editionPhrase(nft)} finalizada à mão, da coleção {nft.collection}. Cada
              atributo fica armazenado nos metadados do token e a procedência é verificada na rede {networkLabel}. A
              obra explora identidade, movimento e luz em um mundo digital sem fronteiras.
            </p>
            <p>
              A propriedade inclui a arte em alta resolução, lançamentos exclusivos para colecionadores e um registro
              permanente de procedência registrada na rede. {nft.creator} recebe 5% de direitos autorais nas vendas
              secundárias, apoiando novos trabalhos e lançamentos da comunidade.
            </p>
          </div>
          <dl className="space-y-5 text-sm">
            <div>
              <dt className="font-bold text-kurio-cream">Rede:</dt>
              <dd className="mt-1 text-kurio-tan">
                Cunhado na {networkLabel} com procedência imutável e metadados armazenados no IPFS.
              </dd>
            </div>
            <div>
              <dt className="font-bold text-kurio-cream">Contrato:</dt>
              <dd className="mt-1 text-kurio-tan">Contrato inteligente ERC-721 verificado.</dd>
              <dd className="mt-1 font-display font-bold text-kurio-cream">{formatContract(nft.contract)}</dd>
            </div>
            <div>
              <dt className="font-bold text-kurio-cream">Direitos autorais:</dt>
              <dd className="mt-1 text-kurio-tan">
                Direitos autorais do criador: 5% nas vendas secundárias, pagos automaticamente pelos mercados
                compatíveis.
              </dd>
            </div>
          </dl>
        </div>
      ) : (
        <div
          role="tabpanel"
          id="panel-reviews"
          aria-labelledby="tab-reviews"
          className="mt-8 rounded-xl border border-dashed border-kurio-line px-6 py-12 text-center"
        >
          <p className="font-display text-sm font-bold text-kurio-cream">
            Avaliações de colecionadores chegam em breve.
          </p>
          <p className="mt-2 text-sm text-kurio-tan">
            19 colecionadores já avaliaram esta obra no mercado Kurio.
          </p>
        </div>
      )}
    </section>
  );
}