import type { ReactNode } from "react";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
}

export default function Modal({
  isOpen,
  onClose,
  title,
  children,
}: ModalProps) {
  if (!isOpen) return null;

  return (
    <div
      className="
        fixed inset-0
        bg-lm-background/80
        backdrop-blur-sm
        flex items-center justify-center
        z-50
      "
    >
      <div
        className="
          bg-lm-surface
          border border-lm-outline/30
          rounded-xl
          shadow-2xl
          shadow-lm-primary/20
          p-6
          w-full
          max-w-lg
          relative
        "
      >
        <button
          onClick={onClose}
          className="
            absolute
            right-4
            top-4
            text-lm-on-surface-variant
            hover:text-lm-primary
            transition
          "
        >
          ✕
        </button>

        {title && (
          <h2 className="text-xl font-bold mb-4 font-montserrat text-lm-on-surface">
            {title}
          </h2>
        )}

        <div className="text-lm-on-surface font-inter">
          {children}
        </div>
      </div>
    </div>
  );
}