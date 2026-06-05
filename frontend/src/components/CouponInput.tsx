import { useState } from 'react';
import { authService } from '../services/auth';

const API_URL = import.meta.env.VITE_API_URL;

type CouponState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'valid'; polarDiscountId: string; description: string }
  | { status: 'invalid'; reason: string };

interface Props {
  onApply: (code: string) => void;
  onRemove: () => void;
}

export default function CouponInput({ onApply, onRemove }: Props) {
  const [code, setCode] = useState('');
  const [state, setState] = useState<CouponState>({ status: 'idle' });

  const handleApply = async () => {
    const trimmed = code.trim();
    if (!trimmed) return;
    setState({ status: 'loading' });

    try {
      const token = authService.getToken();
      const res = await fetch(`${API_URL}/checkout/validate-coupon`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ code: trimmed }),
      });
      const data = await res.json();
      if (data.valid) {
        setState({ status: 'valid', polarDiscountId: data.polarDiscountId, description: data.description });
        onApply(trimmed);
      } else {
        setState({ status: 'invalid', reason: data.reason || 'Código inválido' });
      }
    } catch {
      setState({ status: 'invalid', reason: 'Error al validar código' });
    }
  };

  const handleRemove = () => {
    setCode('');
    setState({ status: 'idle' });
    onRemove();
  };

  return (
    <div className="space-y-2">
      {state.status === 'valid' ? (
        <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-green-900/20 border border-green-500/30">
          <span className="material-symbols-outlined text-green-400 text-lg">check_circle</span>
          <span className="text-body-sm text-green-300 flex-1">{code.toUpperCase()} — {state.description}</span>
          <button onClick={handleRemove} className="text-on-surface-variant hover:text-white transition-colors">
            <span className="material-symbols-outlined text-lg">close</span>
          </button>
        </div>
      ) : (
        <div className="flex gap-2">
          <input
            type="text"
            value={code}
            onChange={(e) => { setCode(e.target.value); if (state.status === 'invalid') setState({ status: 'idle' }); }}
            placeholder="Código de descuento"
            className="flex-1 px-4 py-3 rounded-xl bg-surface-high border border-white/10 text-body-sm text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:border-primary transition-colors"
            onKeyDown={(e) => e.key === 'Enter' && handleApply()}
          />
          <button
            onClick={handleApply}
            disabled={state.status === 'loading' || !code.trim()}
            className="px-4 py-3 rounded-xl bg-primary text-label-sm font-medium text-on-primary hover:bg-primary/90 transition-colors disabled:opacity-50"
          >
            {state.status === 'loading' ? '...' : 'Aplicar'}
          </button>
        </div>
      )}
      {state.status === 'invalid' && (
        <p className="text-body-sm text-red-400 flex items-center gap-1">
          <span className="material-symbols-outlined text-sm">error</span>
          {state.reason}
        </p>
      )}
    </div>
  );
}
