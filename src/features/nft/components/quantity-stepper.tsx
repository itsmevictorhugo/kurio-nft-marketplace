import { cn } from '@/lib/utils';

interface QuantityStepperProps {
  value: number;
  min: number;
  max: number;
  disabled?: boolean;
  onChange: (value: number) => void;
}

const buttonClass =
  'inline-flex h-10 w-10 items-center justify-center rounded-md bg-kurio-flame font-display text-lg font-bold text-kurio-night outline-none transition-colors hover:bg-kurio-accent focus-visible:ring-2 focus-visible:ring-kurio-accent focus-visible:ring-offset-2 focus-visible:ring-offset-kurio-night disabled:pointer-events-none disabled:opacity-40';

export function QuantityStepper({ value, min, max, disabled, onChange }: QuantityStepperProps) {
  return (
    <div className="flex items-center gap-3" role="group" aria-label="Quantidade">
      <button
        type="button"
        onClick={() => onChange(Math.max(min, value - 1))}
        disabled={disabled || value <= min}
        className={buttonClass}
      >
        −
        <span className="sr-only">Diminuir quantidade</span>
      </button>
      <output
        aria-live="polite"
        className={cn('min-w-8 text-center font-display text-lg font-bold text-kurio-cream', disabled && 'opacity-40')}
      >
        {value}
      </output>
      <button
        type="button"
        onClick={() => onChange(Math.min(max, value + 1))}
        disabled={disabled || value >= max}
        className={buttonClass}
      >
        +
        <span className="sr-only">Aumentar quantidade</span>
      </button>
    </div>
  );
}
