import { useParams, useNavigate } from 'react-router-dom';
import './manuscripts-mobile.css';

const MANUSCRIPT_ANALYTICS: Record<number, any> = {
  1: {
    id: 1,
    title: 'The Silent Echoes',
    totalReads: 45230,
    readsGrowth: '+18.5%',
    avgReadTime: '4h 23m',
    completionRate: 89,
    rating: 4.7,
    reviewCount: 342,
    revenue: '$18,450.00',
    revenueGrowth: '+12.3%',
    topRegions: [
      { country: 'United States', percentage: 42, reads: 19000 },
      { country: 'United Kingdom', percentage: 18, reads: 8140 },
      { country: 'Canada', percentage: 12, reads: 5427 },
      { country: 'Australia', percentage: 15, reads: 6784 },
      { country: 'Others', percentage: 13, reads: 5879 },
    ],
    monthlyTrend: [
      { month: 'Jan', reads: 2100 },
      { month: 'Feb', reads: 3200 },
      { month: 'Mar', reads: 4500 },
      { month: 'Apr', reads: 5800 },
      { month: 'May', reads: 7600 },
      { month: 'Jun', reads: 8630 },
    ],
    deviceBreakdown: [
      { device: 'Mobile', percentage: 58 },
      { device: 'Desktop', percentage: 32 },
      { device: 'Tablet', percentage: 10 },
    ],
  },
  2: {
    id: 2,
    title: 'Paper Crowns',
    totalReads: 12450,
    readsGrowth: '+24.2%',
    avgReadTime: '3h 15m',
    completionRate: 76,
    rating: 4.5,
    reviewCount: 89,
    revenue: '$4,230.50',
    revenueGrowth: '+8.9%',
    topRegions: [
      { country: 'United States', percentage: 50, reads: 6225 },
      { country: 'United Kingdom', percentage: 20, reads: 2490 },
      { country: 'Canada', percentage: 15, reads: 1867 },
      { country: 'Others', percentage: 15, reads: 1868 },
    ],
    monthlyTrend: [
      { month: 'Jan', reads: 800 },
      { month: 'Feb', reads: 1200 },
      { month: 'Mar', reads: 1800 },
      { month: 'Apr', reads: 2400 },
      { month: 'May', reads: 3100 },
      { month: 'Jun', reads: 3150 },
    ],
    deviceBreakdown: [
      { device: 'Mobile', percentage: 62 },
      { device: 'Desktop', percentage: 28 },
      { device: 'Tablet', percentage: 10 },
    ],
  },
  3: {
    id: 3,
    title: 'Unwritten Vows',
    totalReads: 2100,
    readsGrowth: '+5.2%',
    avgReadTime: '2h 45m',
    completionRate: 64,
    rating: 4.3,
    reviewCount: 12,
    revenue: '$245.00',
    revenueGrowth: '+2.1%',
    topRegions: [
      { country: 'United States', percentage: 48, reads: 1008 },
      { country: 'United Kingdom', percentage: 22, reads: 462 },
      { country: 'Others', percentage: 30, reads: 630 },
    ],
    monthlyTrend: [
      { month: 'Jan', reads: 150 },
      { month: 'Feb', reads: 180 },
      { month: 'Mar', reads: 220 },
      { month: 'Apr', reads: 280 },
      { month: 'May', reads: 360 },
      { month: 'Jun', reads: 910 },
    ],
    deviceBreakdown: [
      { device: 'Mobile', percentage: 55 },
      { device: 'Desktop', percentage: 35 },
      { device: 'Tablet', percentage: 10 },
    ],
  },
};

export default function ManuscriptAnalytics() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const analytics = MANUSCRIPT_ANALYTICS[parseInt(id || '1')];

  if (!analytics) {
    return (
      <section className="admin-section">
        <div className="text-center py-12">
          <p className="text-on-surface-variant">Analytics not found</p>
          <button
            onClick={() => navigate('/admin/dashboard')}
            className="mt-4 text-primary hover:text-secondary transition-colors"
          >
            Back to Dashboard
          </button>
        </div>
      </section>
    );
  }

  return (
    <>
      {/* Page Header */}
      <section className="admin-section mb-16">
        <button
          onClick={() => navigate('/admin/dashboard')}
          className="flex items-center gap-2 text-secondary hover:text-primary transition-colors mb-4"
        >
          <span className="material-symbols-outlined">arrow_back</span>
          Back to Dashboard
        </button>
        <header>
          <h1 className="font-headline-lg text-headline-lg text-primary mb-2">{analytics.title}</h1>
          <p className="text-on-surface-variant font-body-md">
            Comprehensive analytics and engagement metrics for your manuscript.
          </p>
        </header>
      </section>

      {/* Key Metrics */}
      <section className="admin-section mb-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-gutter lg:gap-12">
          {/* Total Reads */}
          <div className="glass-card p-6 rounded-xl">
            <p className="text-label-md text-label-md text-on-surface-variant mb-2 uppercase tracking-widest">
              Total Reads
            </p>
            <p className="text-headline-md text-headline-md text-primary mb-2">
              {analytics.totalReads.toLocaleString()}
            </p>
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-sm text-on-error-container">trending_up</span>
              <p className="text-body-sm text-on-error-container">{analytics.readsGrowth} this month</p>
            </div>
          </div>

          {/* Avg Read Time */}
          <div className="glass-card p-6 rounded-xl">
            <p className="text-label-md text-label-md text-on-surface-variant mb-2 uppercase tracking-widest">
              Avg. Read Time
            </p>
            <p className="text-headline-md text-headline-md text-primary mb-2">
              {analytics.avgReadTime}
            </p>
            <p className="text-body-sm text-on-surface-variant">Per reading session</p>
          </div>

          {/* Completion Rate */}
          <div className="glass-card p-6 rounded-xl">
            <p className="text-label-md text-label-md text-on-surface-variant mb-2 uppercase tracking-widest">
              Completion Rate
            </p>
            <p className="text-headline-md text-headline-md text-primary mb-2">
              {analytics.completionRate}%
            </p>
            <p className="text-body-sm text-on-surface-variant">Of readers finish</p>
          </div>

          {/* Rating */}
          <div className="glass-card p-6 rounded-xl">
            <p className="text-label-md text-label-md text-on-surface-variant mb-2 uppercase tracking-widest">
              Rating
            </p>
            <div className="flex items-center gap-2 mb-2">
              <p className="text-headline-md text-headline-md text-primary">
                {analytics.rating}
              </p>
              <span className="text-accent-gold">★</span>
            </div>
            <p className="text-body-sm text-on-surface-variant">{analytics.reviewCount} reviews</p>
          </div>
        </div>
      </section>

      {/* Revenue & Engagement */}
      <section className="admin-section mb-16">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-gutter lg:gap-12">
          {/* Revenue */}
          <div className="glass-card p-8 rounded-xl">
            <h3 className="font-headline-sm text-headline-sm text-primary mb-6">Revenue Generated</h3>
            <p className="text-display-lg text-headline-md text-primary mb-2">
              {analytics.revenue}
            </p>
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-sm text-on-error-container">trending_up</span>
              <p className="text-body-sm text-on-error-container">{analytics.revenueGrowth} this month</p>
            </div>
          </div>

          {/* Device Breakdown */}
          <div className="glass-card p-8 rounded-xl">
            <h3 className="font-headline-sm text-headline-sm text-primary mb-6">Device Breakdown</h3>
            <div className="space-y-4">
              {analytics.deviceBreakdown.map((device: any, idx: number) => (
                <div key={idx}>
                  <div className="flex justify-between mb-2">
                    <p className="text-body-sm text-on-surface-variant">{device.device}</p>
                    <p className="text-body-sm text-primary font-semibold">{device.percentage}%</p>
                  </div>
                  <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-secondary"
                      style={{ width: `${device.percentage}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Geographic Data */}
      <section className="admin-section mb-16">
        <div className="glass-card p-8 rounded-xl">
          <h3 className="font-headline-sm text-headline-sm text-primary mb-6">Top Regions</h3>
          <div className="space-y-4">
            {analytics.topRegions.map((region: any, idx: number) => (
              <div key={idx} className="flex items-center justify-between p-4 bg-white/5 rounded-lg">
                <div className="flex-1">
                  <p className="text-body-md text-primary mb-1">{region.country}</p>
                  <p className="text-body-sm text-on-surface-variant">{region.reads.toLocaleString()} reads</p>
                </div>
                <div className="text-right">
                  <p className="text-headline-sm text-headline-sm text-secondary">{region.percentage}%</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Monthly Trend */}
      <section className="admin-section">
        <div className="glass-card p-8 rounded-xl">
          <h3 className="font-headline-sm text-headline-sm text-primary mb-6">Monthly Read Trend</h3>
          <div className="grid grid-cols-6 gap-2">
            {analytics.monthlyTrend.map((month: any, idx: number) => {
              const maxReads = Math.max(...analytics.monthlyTrend.map((m: any) => m.reads));
              const percentage = (month.reads / maxReads) * 100;
              return (
                <div key={idx} className="flex flex-col items-center">
                  <div className="w-full h-24 bg-white/5 rounded-lg mb-2 flex items-end justify-center p-2 relative">
                    <div
                      className="w-full bg-secondary rounded-t transition-all"
                      style={{ height: `${percentage}%` }}
                    />
                  </div>
                  <p className="text-label-md text-on-surface-variant">{month.month}</p>
                  <p className="text-body-sm text-primary text-center mt-1">{(month.reads / 1000).toFixed(1)}k</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Action Buttons */}
      <section className="admin-section mt-8">
        <div className="flex gap-4 flex-col md:flex-row justify-center">
          <button
            onClick={() => navigate(`/admin/manuscripts/${analytics.id}`)}
            className="px-8 py-3 border border-white/10 text-primary rounded-lg hover:bg-white/5 transition-colors font-label-md text-label-md uppercase tracking-widest"
          >
            Back to Editing
          </button>
          <button className="px-8 py-3 bg-accent-gold text-background rounded-lg hover:opacity-90 transition-all font-label-md text-label-md uppercase tracking-widest">
            Export Report
          </button>
        </div>
      </section>
    </>
  );
}
