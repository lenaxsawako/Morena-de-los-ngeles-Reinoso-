import { useState, useEffect } from 'react';
import './sales.css';
import { adminBooksService, type AnalyticsMetrics, type TransactionsResponse } from '../../../services/adminBooks';

export default function SalesData() {
  const [period, setPeriod] = useState<'7d' | '30d' | '90d' | '12m'>('30d');
  const [analytics, setAnalytics] = useState<AnalyticsMetrics | null>(null);
  const [transactions, setTransactions] = useState<TransactionsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [notificationModal, setNotificationModal] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const [analyticsData, transactionsData] = await Promise.all([
          adminBooksService.getAnalytics(period),
          adminBooksService.getTransactions(1, 10),
        ]);
        
        setAnalytics(analyticsData);
        setTransactions(transactionsData);
      } catch (error) {
        console.error('Error loading sales data:', error);
      } finally {
        setLoading(false);
      }
    };
    
    loadData();
  }, [period]);

  const handleExportReport = async () => {
    try {
      const csvBlob = await adminBooksService.exportTransactionsCSV('paid');
      if (csvBlob) {
        // Create a download link
        const url = window.URL.createObjectURL(csvBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `transactions-${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error('Error exporting report:', error);
      setNotificationModal({ type: 'error', message: 'Error exporting report' });
    }
  };

  const periodLabels: Record<string, string> = {
    '7d': 'Últimos 7 Días',
    '30d': 'Últimos 30 Días',
    '90d': 'Últimos 90 Días',
    '12m': 'Últimos 12 Meses',
  };

  const statusColors: Record<string, string> = {
    paid: 'text-green-500',
    pending: 'text-orange-400',
    failed: 'text-red-400',
    refunded: 'text-red-400',
  };

  // Generate chart path dynamically from analytics data
  const generateChartPath = (data: typeof analytics) => {
    if (!data?.chart || data.chart.length === 0) {
      return { mainPath: '', gradientPath: '', hasData: false };
    }

    const points = data.chart;
    const maxRevenue = Math.max(...points.map(p => p.revenue), 1);
    const svgWidth = 1000;
    const svgHeight = 400;
    const maxY = 350; // Leave room for labels

    // Normalize points to SVG coordinates
    const normalizedPoints = points.map((point, idx) => {
      const x = (idx / Math.max(points.length - 1, 1)) * svgWidth;
      const y = maxY - (point.revenue / maxRevenue) * 300; // Use revenue for Y position
      return { x, y, ...point };
    });

    // Generate main line path
    const mainPath = normalizedPoints
      .map((point, idx) => `${idx === 0 ? 'M' : 'L'}${point.x},${point.y}`)
      .join(' ');

    // Generate filled area path
    const gradientPath =
      mainPath +
      ` V${svgHeight} H0 Z`;

    return { mainPath, gradientPath, hasData: true };
  };

  const chartPath = generateChartPath(analytics);

  // Extract month labels from chart data
  const getMonthLabels = () => {
    if (!analytics?.chart || analytics.chart.length === 0) {
      return [];
    }

    return analytics.chart.map(point => {
      const date = new Date(point.label);
      return date.toLocaleDateString('en-US', { month: 'short' }).toUpperCase();
    });
  };

  const monthLabels = getMonthLabels();

  return (
    <>
      {loading && (
        <section className="admin-section" style={{ textAlign: 'center', padding: '3rem' }}>
          <p style={{ color: '#ccc6bb' }}>Cargando datos...</p>
        </section>
      )}

      {!loading && (
        <>
      {/* Header Section */}
      <section className="admin-section mb-16">
        <header className="flex justify-between items-end">
          <div>
            <h1 className="font-headline-lg text-headline-lg text-primary">Analytics & Ingresos</h1>
            <p className="font-body-lg text-body-lg text-on-surface-variant max-w-[600px] mt-4">
              Métricas de ventas, desempeño de libros y transacciones recientes.
            </p>
          </div>
          <div className="flex space-x-4 mb-2">
            <select 
              value={period}
              onChange={(e) => setPeriod(e.target.value as any)}
              className="bg-surface-container-high px-4 py-2 border border-white/5 font-label-md text-label-md hover:border-primary transition-colors cursor-pointer"
            >
              <option value="7d">Últimos 7 Días</option>
              <option value="30d">Últimos 30 Días</option>
              <option value="90d">Últimos 90 Días</option>
              <option value="12m">Últimos 12 Meses</option>
            </select>
            <button 
              onClick={handleExportReport}
              className="border border-white/20 px-6 py-2 font-label-md text-label-md hover:border-primary transition-colors flex items-center space-x-2"
            >
              <span className="material-symbols-outlined notranslate text-sm text-primary" translate="no">download</span>
              <span className="text-primary">Export CSV</span>
            </button>
          </div>
        </header>
      </section>

      {/* Revenue Overview Cards */}
      <section className="admin-section mb-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-gutter">
          {/* Total Revenue */}
          <div className="glass-card p-8 group hover:border-primary/20 transition-all">
            <p className="font-label-md text-label-md text-on-surface-variant uppercase tracking-widest mb-4">
              Ingresos Totales
            </p>
            <h3 className="font-headline-md text-headline-md text-primary">
              {analytics ? adminBooksService.formatPrice(analytics.summary.totalRevenue * 100) : '$0.00'}
            </h3>
            <p className="mt-2 font-body-sm text-body-sm text-on-surface-variant">
              {periodLabels[period]}
            </p>
          </div>

          {/* Monthly Revenue */}
          <div className="glass-card p-8">
            <p className="font-label-md text-label-md text-on-surface-variant uppercase tracking-widest mb-4">
              Ingresos Mensuales
            </p>
            <h3 className="font-headline-md text-headline-md text-primary">
              {analytics ? adminBooksService.formatPrice(analytics.summary.monthlyRevenue * 100) : '$0.00'}
            </h3>
            <p className="mt-2 font-body-sm text-body-sm text-on-surface-variant">
              Este mes
            </p>
          </div>

          {/* Total Purchases */}
          <div className="glass-card p-8">
            <p className="font-label-md text-label-md text-on-surface-variant uppercase tracking-widest mb-4">
              Compras Totales
            </p>
            <h3 className="font-headline-md text-headline-md text-primary">
              {analytics?.summary.totalPurchases.toLocaleString() || '0'}
            </h3>
            <p className="mt-2 font-body-sm text-body-sm text-on-surface-variant">
              Transacciones completadas
            </p>
          </div>

          {/* Average Order Value */}
          <div className="glass-card p-8">
            <p className="font-label-md text-label-md text-on-surface-variant uppercase tracking-widest mb-4">
              Valor Promedio
            </p>
            <h3 className="font-headline-md text-headline-md text-primary">
              {analytics ? adminBooksService.formatPrice(analytics.summary.averageOrderValue * 100) : '$0.00'}
            </h3>
            <p className="mt-2 font-body-sm text-body-sm text-on-surface-variant">
              Por transacción
            </p>
          </div>
        </div>
      </section>

      {/* Sales Trends Chart Section */}
      <section className="admin-section glass-card p-8 mb-16">
        <div className="flex justify-between items-center mb-12">
          <h4 className="font-headline-sm text-headline-sm text-primary">Performance Trajectory</h4>
          <div className="flex space-x-6">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-primary" />
              <span className="font-label-md text-label-md text-on-surface-variant">Revenue</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-secondary" />
              <span className="font-label-md text-label-md text-on-surface-variant">Units</span>
            </div>
          </div>
        </div>

        <div className="h-[400px] w-full relative flex items-end justify-between px-4">
          <svg className="absolute inset-0 h-full w-full" preserveAspectRatio="none" viewBox="0 0 1000 400">
            <defs>
              <linearGradient id="chartGradient" x1="0" x2="0" y1="0" y2="1">
                <stop offset="0%" stopColor="#F3EAD3" stopOpacity="0.2" />
                <stop offset="100%" stopColor="#F3EAD3" stopOpacity="0" />
              </linearGradient>
            </defs>
            {chartPath.hasData && (
              <>
                <path
                  d={chartPath.gradientPath}
                  fill="url(#chartGradient)"
                />
                <path
                  d={chartPath.mainPath}
                  fill="none"
                  stroke="#F3EAD3"
                  strokeWidth="2"
                />
              </>
            )}
            {!chartPath.hasData && (
              <text x="500" y="200" textAnchor="middle" fill="#ccc6bb" fontSize="16">
                No hay datos disponibles
              </text>
            )}
          </svg>

          <div className="absolute -bottom-8 left-0 right-0 flex justify-between font-label-md text-label-md text-on-surface-variant/40">
            {monthLabels.length > 0 ? (
              monthLabels.map((month, idx) => (
                <span key={idx}>{month}</span>
              ))
            ) : (
              <>
                <span>JAN</span>
                <span>FEB</span>
                <span>MAR</span>
                <span>APR</span>
                <span>MAY</span>
                <span>JUN</span>
                <span>JUL</span>
                <span>AUG</span>
                <span>SEP</span>
                <span>OCT</span>
              </>
            )}
          </div>
        </div>
      </section>

      {/* Top Performing Books */}
      <section className="admin-section glass-card overflow-hidden mb-16">
        <div className="p-8 border-b border-white/5">
          <h4 className="font-headline-sm text-headline-sm text-primary">Libros Destacados</h4>
        </div>

        <div className="divide-y divide-white/5">
          {analytics?.topBooks && analytics.topBooks.length > 0 ? (
            analytics.topBooks.map((book) => (
              <div key={book.bookId} className="p-8 flex items-center hover:bg-white/[0.02] transition-colors group">
                <div className="w-16 h-24 bg-surface-container-high mr-8 overflow-hidden shadow-2xl flex-shrink-0">
                  {book.coverUrl ? (
                    <img
                      src={book.coverUrl}
                      alt={book.title}
                      className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-500"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <span className="material-symbols-outlined notranslate text-primary/20" translate="no">book</span>
                    </div>
                  )}
                </div>

                <div className="flex-grow">
                  <h5 className="font-headline-sm text-headline-sm text-primary">{book.title}</h5>
                  <p className="font-label-md text-label-md text-on-surface-variant mt-1">
                    Libro PDF
                  </p>
                </div>

                <div className="flex space-x-12">
                  <div className="text-right">
                    <p className="font-label-md text-label-md text-on-surface-variant uppercase">Ingresos</p>
                    <p className="font-body-lg text-body-lg text-primary">{adminBooksService.formatPrice(book.revenue * 100)}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-label-md text-label-md text-on-surface-variant uppercase">Compras</p>
                    <p className="font-body-lg text-body-lg text-primary">{book.purchases.toLocaleString()}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-label-md text-label-md text-on-surface-variant uppercase">Conversión</p>
                    <p className="font-body-lg text-body-lg text-primary">{book.conversionRate.toFixed(1)}%</p>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="p-8 text-center text-on-surface-variant">
              <p>No hay datos disponibles</p>
            </div>
          )}
        </div>
      </section>

      {/* Recent Transactions */}
      <section className="admin-section glass-card overflow-hidden mb-24">
        <div className="p-8 border-b border-white/5 flex justify-between items-center">
          <h4 className="font-headline-sm text-headline-sm text-primary">Transacciones Recientes</h4>
          <div className="hidden md:flex items-center space-x-2 text-on-surface-variant">
            <span className="material-symbols-outlined notranslate text-sm" translate="no">filter_list</span>
            <span className="font-label-md text-label-md">Filtrar</span>
          </div>
        </div>

        {/* Desktop Table */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left transactions-table">
            <thead>
              <tr className="bg-surface-container-high">
                <th className="px-8 py-4 font-label-md text-label-md text-on-surface-variant uppercase tracking-widest">
                  Fecha
                </th>
                <th className="px-8 py-4 font-label-md text-label-md text-on-surface-variant uppercase tracking-widest">
                  Libro
                </th>
                <th className="px-8 py-4 font-label-md text-label-md text-on-surface-variant uppercase tracking-widest">
                  Email del Usuario
                </th>
                <th className="px-8 py-4 font-label-md text-label-md text-on-surface-variant uppercase tracking-widest text-right">
                  Precio
                </th>
                <th className="px-8 py-4 font-label-md text-label-md text-on-surface-variant uppercase tracking-widest">
                  Proveedor
                </th>
                <th className="px-8 py-4 font-label-md text-label-md text-on-surface-variant uppercase tracking-widest text-right">
                  Estado
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {transactions?.items && transactions.items.length > 0 ? (
                transactions.items.map((transaction) => (
                  <tr key={transaction.purchaseId} className="hover:bg-white/[0.02] transition-colors">
                    <td className="px-8 py-6 font-body-sm text-body-sm text-on-surface-variant">
                      {new Date(transaction.createdAt).toLocaleDateString('es-ES')}
                    </td>
                    <td className="px-8 py-6 font-body-sm text-body-sm text-primary">{transaction.bookTitle}</td>
                    <td className="px-8 py-6 font-body-sm text-body-sm text-on-surface-variant">{transaction.userEmail}</td>
                    <td className="px-8 py-6 font-body-sm text-body-sm text-primary text-right">
                      ${transaction.price.toFixed(2)}
                    </td>
                    <td className="px-8 py-6 font-body-sm text-body-sm text-on-surface-variant">
                      {transaction.provider.charAt(0).toUpperCase() + transaction.provider.slice(1)}
                    </td>
                    <td className={`px-8 py-6 text-right font-label-md text-[10px] uppercase ${statusColors[transaction.status]}`}>
                      {transaction.status}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-8 py-6 text-center text-on-surface-variant">
                    No hay transacciones disponibles
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile List */}
        <div className="md:hidden divide-y divide-white/5">
          {transactions?.items && transactions.items.length > 0 ? (
            transactions.items.map((transaction) => (
              <div key={transaction.purchaseId} className="p-4 hover:bg-white/[0.02] transition-colors space-y-2">
                <div className="flex justify-between items-start">
                  <div className="flex-grow">
                    <p className="font-body-sm text-body-sm text-primary">{transaction.bookTitle}</p>
                    <p className="font-label-sm text-label-sm text-on-surface-variant mt-1">
                      {new Date(transaction.createdAt).toLocaleDateString('es-ES')}
                    </p>
                  </div>
                  <p className={`font-label-md text-label-md ${statusColors[transaction.status]}`}>
                    {transaction.status}
                  </p>
                </div>
                <div className="flex justify-between items-center text-body-sm">
                  <p className="text-on-surface-variant truncate pr-2">{transaction.userEmail}</p>
                  <p className="text-primary font-medium whitespace-nowrap">${transaction.price.toFixed(2)}</p>
                </div>
                <p className="text-label-sm text-on-surface-variant/70">
                  {transaction.provider.charAt(0).toUpperCase() + transaction.provider.slice(1)}
                </p>
              </div>
            ))
          ) : (
            <div className="p-6 text-center text-on-surface-variant">
              <p>No hay transacciones disponibles</p>
            </div>
          )}
        </div>

        <div className="p-8 flex justify-center bg-surface-container-low">
          {transactions?.items && transactions.items.length > 0 && (
            <button className="text-on-surface-variant font-label-md text-label-md hover:text-primary transition-colors flex items-center">
              Cargar Más Transacciones
            <span className="material-symbols-outlined notranslate ml-2 text-sm" translate="no">expand_more</span>
            </button>
          )}
        </div>
      </section>
        </>
      )}

      {notificationModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center" onClick={() => setNotificationModal(null)}>
          <div className="bg-surface p-6 rounded-lg shadow-lg max-w-sm w-full mx-4" onClick={e => e.stopPropagation()}>
            <div className="flex flex-col items-center text-center">
              <span className={`material-symbols-outlined text-4xl mb-2 ${notificationModal.type === 'success' ? 'text-accent-gold' : 'text-error'}`}>
                {notificationModal.type === 'success' ? 'check_circle' : 'error'}
              </span>
              <h3 className="text-lg font-semibold text-on-surface mb-1">
                {notificationModal.type === 'success' ? 'Success' : 'Error'}
              </h3>
              <p className="text-on-surface-variant text-body-sm mt-1">{notificationModal.message}</p>
              <button
                onClick={() => setNotificationModal(null)}
                className="mt-4 px-6 py-2 bg-accent-gold text-surface font-semibold rounded hover:bg-accent-gold/90 transition-all"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
