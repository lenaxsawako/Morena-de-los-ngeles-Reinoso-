import { useState, useEffect } from 'react';
import { authService } from '../../../services/auth';

const API_URL = import.meta.env.VITE_API_URL;

interface Coupon {
  polarDiscountId: string;
  code: string;
  name: string;
  type: string;
  amount: number;
  redemptionsCount: number;
  maxRedemptions: number | null;
  endsAt: string | null;
  maxUsesPerUser: number;
  usedBy: { userId: string; usedAt: string }[];
  createdAt: string;
}

export default function AdminCoupons() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', code: '', type: 'percentage' as const, amount: 10, endsAt: '', maxRedemptions: 100, maxUsesPerUser: 1 });
  const [loading, setLoading] = useState(true);

  const authHeaders = () => ({ 'Authorization': `Bearer ${authService.getToken()}`, 'Content-Type': 'application/json' });

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/admin/coupons`, { headers: authHeaders() });
      if (res.ok) setCoupons(await res.json());
    } catch { /* ignore */ }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API_URL}/admin/coupons`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({ ...form, endsAt: form.endsAt || undefined }),
      });
      if (res.ok) {
        setShowForm(false);
        setForm({ name: '', code: '', type: 'percentage', amount: 10, endsAt: '', maxRedemptions: 100, maxUsesPerUser: 1 });
        await load();
      }
    } catch { /* ignore */ }
  };

  const handleDelete = async (polarDiscountId: string) => {
    if (!confirm('¿Eliminar este cupón?')) return;
    try {
      await fetch(`${API_URL}/admin/coupons/${polarDiscountId}`, { method: 'DELETE', headers: authHeaders() });
      await load();
    } catch { /* ignore */ }
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="font-headline-lg text-headline-lg">Cupones</h1>
        <button onClick={() => setShowForm(!showForm)} className="bg-primary text-background font-label-md px-6 py-3 tracking-wider hover:opacity-90 transition-all">
          {showForm ? 'Cancelar' : 'Nuevo Cupón'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleCreate} className="p-6 rounded-2xl border border-white/10 bg-surface-container space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-label-sm text-on-surface-variant">Nombre</label>
              <input required value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} className="w-full px-4 py-3 rounded-xl bg-surface-high border border-white/10 text-body-md focus:outline-none focus:border-primary" />
            </div>
            <div className="space-y-1">
              <label className="text-label-sm text-on-surface-variant">Código</label>
              <input required value={form.code} onChange={e => setForm(f => ({ ...f, code: e.target.value.toUpperCase() }))} className="w-full px-4 py-3 rounded-xl bg-surface-high border border-white/10 text-body-md uppercase focus:outline-none focus:border-primary" />
            </div>
            <div className="space-y-1">
              <label className="text-label-sm text-on-surface-variant">Tipo</label>
              <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value as any }))} className="w-full px-4 py-3 rounded-xl bg-surface-high border border-white/10 text-body-md focus:outline-none focus:border-primary">
                <option value="percentage">Porcentaje</option>
                <option value="fixed">Fijo (centavos)</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-label-sm text-on-surface-variant">{form.type === 'percentage' ? 'Porcentaje' : 'Monto (centavos)'}</label>
              <input type="number" min={1} value={form.amount} onChange={e => setForm(f => ({ ...f, amount: Number(e.target.value) }))} className="w-full px-4 py-3 rounded-xl bg-surface-high border border-white/10 text-body-md focus:outline-none focus:border-primary" />
            </div>
            <div className="space-y-1">
              <label className="text-label-sm text-on-surface-variant">Vence (opcional)</label>
              <input type="datetime-local" value={form.endsAt} onChange={e => setForm(f => ({ ...f, endsAt: e.target.value }))} className="w-full px-4 py-3 rounded-xl bg-surface-high border border-white/10 text-body-md focus:outline-none focus:border-primary" />
            </div>
            <div className="space-y-1">
              <label className="text-label-sm text-on-surface-variant">Máx. usos totales</label>
              <input type="number" min={1} value={form.maxRedemptions} onChange={e => setForm(f => ({ ...f, maxRedemptions: Number(e.target.value) }))} className="w-full px-4 py-3 rounded-xl bg-surface-high border border-white/10 text-body-md focus:outline-none focus:border-primary" />
            </div>
            <div className="space-y-1">
              <label className="text-label-sm text-on-surface-variant">Máx. usos por usuario</label>
              <input type="number" min={1} value={form.maxUsesPerUser} onChange={e => setForm(f => ({ ...f, maxUsesPerUser: Number(e.target.value) }))} className="w-full px-4 py-3 rounded-xl bg-surface-high border border-white/10 text-body-md focus:outline-none focus:border-primary" />
            </div>
          </div>
          <button type="submit" className="bg-primary text-background font-label-md px-8 py-3 tracking-wider hover:opacity-90 transition-all">Crear en Polar</button>
        </form>
      )}

      <div className="space-y-3">
        {loading ? (
          <p className="text-on-surface-variant">Cargando...</p>
        ) : coupons.length === 0 ? (
          <p className="text-on-surface-variant">No hay cupones todavía</p>
        ) : coupons.map(c => (
          <div key={c.polarDiscountId} className="p-4 rounded-xl border border-white/10 bg-surface-high flex items-center justify-between gap-4">
            <div className="space-y-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-medium text-primary">{c.name}</span>
                <span className="px-2 py-0.5 rounded bg-surface-container text-label-xs text-on-surface-variant font-mono">{c.code}</span>
                <span className="text-label-sm text-on-surface-variant">
                  {c.type === 'percentage' ? `${c.amount}%` : `$${(c.amount / 100).toFixed(2)}`}
                </span>
              </div>
              <p className="text-label-sm text-on-surface-variant">
                Usos: {c.redemptionsCount}{c.maxRedemptions ? ` / ${c.maxRedemptions}` : ''}
                {c.endsAt ? ` — Vence: ${new Date(c.endsAt).toLocaleDateString('es-ES')}` : ''}
              </p>
            </div>
            <button onClick={() => handleDelete(c.polarDiscountId)} className="shrink-0 p-2 rounded-xl hover:bg-white/5 text-on-surface-variant hover:text-red-400 transition-colors">
              <span className="material-symbols-outlined text-lg">delete</span>
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
