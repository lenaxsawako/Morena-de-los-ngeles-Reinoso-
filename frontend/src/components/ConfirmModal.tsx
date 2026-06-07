interface ConfirmModalProps {
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
  confirmLabel?: string;
  cancelLabel?: string;
}

export default function ConfirmModal({ message, onConfirm, onCancel, confirmLabel = 'Eliminar', cancelLabel = 'Cancelar' }: ConfirmModalProps) {
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-surface-container rounded-lg max-w-sm w-full p-6 border border-white/10">
        <div className="flex items-start gap-3 mb-4">
          <span className="material-symbols-outlined text-3xl text-error">warning</span>
          <div>
            <h3 className="text-headline-md font-headline-md text-primary">Confirmar</h3>
            <p className="text-on-surface-variant text-body-sm mt-1">{message}</p>
          </div>
        </div>
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 px-4 py-2 border border-white/10 text-primary rounded hover:bg-white/5 transition-all"
          >
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 px-4 py-2 bg-error text-white rounded hover:opacity-90 transition-all font-semibold"
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
