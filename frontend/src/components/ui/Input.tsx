import type { InputHTMLAttributes } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
}

export default function Input({
  label,
  className = "",
  ...props
}: InputProps) {
  return (
    <div className="flex flex-col gap-2">
      {label && (
        <label className="text-sm font-medium font-inter text-lm-on-surface">
          {label}
        </label>
      )}

      <input
        className={`
          px-4 py-2
          border
          border-lm-outline/30
          bg-lm-surface/50
          text-lm-on-surface
          rounded-lg
          outline-none
          focus:ring-2
          focus:ring-lm-primary/50
          focus:border-lm-primary
          placeholder:text-lm-on-surface-variant
          transition

          ${className}
        `}
        {...props}
      />
    </div>
  );
}