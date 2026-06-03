import type { ButtonHTMLAttributes, ReactNode } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  variant?: "primary" | "secondary" | "danger";
}

export default function Button({
  children,
  variant = "primary",
  className = "",
  ...props
}: ButtonProps) {
  const variants = {
    primary:
      "bg-accent hover:bg-accent-dark text-on-primary hover:shadow-md hover:shadow-accent/30",
    secondary:
      "bg-surface hover:bg-surface-high text-on-surface border border-outline/50 hover:border-accent/50",
    danger:
      "bg-error hover:bg-error text-on-background hover:shadow-md hover:shadow-error/50",
  };

  return (
    <button
      className={`
        px-4 py-2
        rounded-lg
        font-montserrat font-semibold
        transition
        cursor-pointer
        disabled:opacity-50
        disabled:cursor-not-allowed
        ${variants[variant]}
        ${className}
      `}
      {...props}
    >
      {children}
    </button>
  );
}