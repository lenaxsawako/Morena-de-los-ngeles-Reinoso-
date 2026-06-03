import type { ReactNode } from "react";

interface CardProps {
  children: ReactNode;
  className?: string;
}

export default function Card({
  children,
  className = "",
}: CardProps) {
  return (
    <div
      className={`
        bg-lm-surface
        border border-lm-outline/30
        rounded-xl
        shadow-md
        shadow-lm-primary/10
        p-4
        ${className}
      `}
    >
      {children}
    </div>
  );
}