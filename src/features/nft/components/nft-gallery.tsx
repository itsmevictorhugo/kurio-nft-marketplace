import { useState } from 'react';
import { cn } from '@/lib/utils';

interface NftGalleryProps {
  imageUrl: string;
  nftName: string;
}

/**
 * Visual gallery for the detail page: the runtime artwork is the only real
 * asset, so every frame renders the same image (reference-only section).
 */
export function NftGallery({ imageUrl, nftName }: NftGalleryProps) {
  const [selected, setSelected] = useState(0);
  const frames = 4;

  return (
    <div className="flex gap-3">
      <ul aria-label="Galeria de imagens do NFT" className="hidden shrink-0 flex-col gap-3 lg:flex">
        {Array.from({ length: frames }, (_, index) => (
          <li key={index}>
            <button
              type="button"
              aria-label={`Ver imagem ${index + 1} de ${nftName}`}
              aria-current={selected === index}
              onClick={() => setSelected(index)}
              className={cn(
                'block w-20 overflow-hidden rounded-lg bg-kurio-surface p-1.5 outline-none transition-colors focus-visible:ring-2 focus-visible:ring-kurio-accent',
                selected === index ? 'ring-2 ring-kurio-accent' : 'hover:bg-kurio-raised',
              )}
            >
              <img src={imageUrl} alt="" className="aspect-square w-full rounded-md object-cover" />
            </button>
          </li>
        ))}
      </ul>

      <div className="min-w-0 flex-1">
        <div className="rounded-xl bg-kurio-surface p-3 md:p-4">
          <img
            src={imageUrl}
            alt={`Arte do NFT ${nftName}`}
            className="aspect-square w-full rounded-lg object-cover"
          />
        </div>
      </div>
    </div>
  );
}
