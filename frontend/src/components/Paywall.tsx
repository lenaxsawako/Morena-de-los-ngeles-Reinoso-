import Button from "./ui/Button";

interface PaywallProps {
  title: string;
  description?: string;
  price: number;
  onBuy?: () => void;
}

export default function Paywall({
  title,
  description,
  price,
  onBuy,
}: PaywallProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-8 px-6 py-12 text-center">
      {/* Lock Icon */}
      <div className="flex h-20 w-20 items-center justify-center rounded-2xl border border-on-surface-variant/20 bg-surface-container">
        <span className="material-symbols-outlined text-4xl">lock</span>
      </div>

      {/* Title */}
      <h2 className="text-3xl font-bold text-on-surface font-montserrat">
        {title}
      </h2>

      {/* Description */}
      {description && (
        <p className="max-w-sm text-base text-on-surface-variant font-inter">
          {description}
        </p>
      )}

      {/* Price */}
      <div className="text-5xl font-bold text-primary font-montserrat">
        {price > 0 ? `$${price.toFixed(2)}` : 'Gratis'}
      </div>

      {/* Button */}
      <Button
        className="mt-4 w-full max-w-xs"
        onClick={onBuy}
      >
        Comprar acceso
      </Button>
    </div>
  );
}