import React from 'react';

interface IconProps extends React.HTMLAttributes<HTMLSpanElement> {
  name: string;
  filled?: boolean;
  wght?: 100 | 200 | 300 | 400 | 500 | 600 | 700;
  grad?: number;
  opsz?: 20 | 24 | 40 | 48;
}

/**
 * Icon component for Material Symbols
 * Protects icon names from Google Translate and other automatic translators
 * by using translate="no" attribute
 */
export function Icon({
  name,
  filled = false,
  wght = 400,
  grad = 0,
  opsz = 24,
  className = '',
  ...props
}: IconProps) {
  return (
    <span
      className={`material-symbols-outlined notranslate ${className}`}
      translate="no"
      style={{
        fontVariationSettings: `'FILL' ${filled ? 1 : 0}, 'wght' ${wght}, 'GRAD' ${grad}, 'opsz' ${opsz}`,
      }}
      {...props}
    >
      {name}
    </span>
  );
}
