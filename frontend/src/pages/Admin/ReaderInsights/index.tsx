import { useState, useEffect } from 'react';
import { adminBooksService, type CommunityStats, type CommunityReview, type CommunityReader, type ReaderActivityMetrics } from '../../../services/adminBooks';

export default function ReaderInsights() {
  const [stats, setStats] = useState<CommunityStats | null>(null);
  const [reviews, setReviews] = useState<CommunityReview[]>([]);
  const [topReaders, setTopReaders] = useState<CommunityReader[]>([]);
  const [readerActivity, setReaderActivity] = useState<ReaderActivityMetrics | null>(null);
  const [activityPeriod, setActivityPeriod] = useState<'7d' | '30d' | '90d'>('7d');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const [statsData, reviewsData, readersData, activityData] = await Promise.all([
          adminBooksService.getCommunityStats(),
          adminBooksService.getReviews(10, 1),
          adminBooksService.getTopReaders(3),
          adminBooksService.getReaderActivity(activityPeriod),
        ]);
        
        setStats(statsData);
        setReviews(reviewsData);
        setTopReaders(readersData);
        setReaderActivity(activityData);
      } catch (error) {
        console.error('Error loading community data:', error);
      } finally {
        setLoading(false);
      }
    };
    
    loadData();
  }, [activityPeriod]);

  const formatLastActivity = (date: string): string => {
    const now = new Date();
    const activityDate = new Date(date);
    const diffInMs = now.getTime() - activityDate.getTime();
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));
    
    if (diffInDays === 0) return 'Today';
    if (diffInDays === 1) return 'Yesterday';
    if (diffInDays < 7) return `${diffInDays} days ago`;
    if (diffInDays < 30) return `${Math.floor(diffInDays / 7)} weeks ago`;
    return `${Math.floor(diffInDays / 30)} months ago`;
  };

  const generateActivityChartPath = () => {
    if (!readerActivity?.chart || readerActivity.chart.length === 0) {
      return { mainPath: '', gradientPath: '', hasData: false, points: [] };
    }

    const data = readerActivity.chart;
    const maxSessions = Math.max(...data.map(d => d.sessions), 1);
    
    const viewBoxWidth = 1000;
    const viewBoxHeight = 200;
    const padding = 20;
    const effectiveWidth = viewBoxWidth - 2 * padding;
    const effectiveHeight = viewBoxHeight - 2 * padding;
    
    // Calculate x position for each data point
    const xStep = effectiveWidth / (data.length - 1 || 1);
    
    // Generate path points
    const points = data.map((point, idx) => ({
      x: padding + idx * xStep,
      y: padding + effectiveHeight - (point.sessions / maxSessions) * effectiveHeight,
      sessions: point.sessions,
    }));
    
    // Generate smooth curve path using quadratic Bezier curves
    let pathString = '';
    for (let i = 0; i < points.length; i++) {
      if (i === 0) {
        pathString += `M${points[i].x},${points[i].y}`;
      } else {
        // Quadratic Bezier: control point is midpoint between current and previous
        const cpx = (points[i - 1].x + points[i].x) / 2;
        const cpy = (points[i - 1].y + points[i].y) / 2;
        pathString += ` Q${cpx},${cpy} ${points[i].x},${points[i].y}`;
      }
    }
    
    // Create gradient path (same as main + fill to bottom)
    const gradientPathString = pathString + ` V${viewBoxHeight - padding} H${padding} Z`;
    
    return {
      mainPath: pathString,
      gradientPath: gradientPathString,
      hasData: true,
      points: points,
    };
  };

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
          <section className="admin-section mb-20">
            <h2 className="font-headline-lg text-headline-lg text-primary mb-4">Community Insights</h2>
            <p className="font-body-lg text-on-surface-variant max-w-[600px] leading-relaxed">
              Understand your readers, track engagement and review activity.
            </p>
          </section>

          {/* Summary Cards */}
          <section className="admin-section mb-24">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-gutter">
              {/* Total Readers */}
              <div className="glass-card p-8 group hover:-translate-y-1 transition-transform duration-500">
                <p className="font-label-md text-on-surface-variant mb-6 uppercase tracking-[0.1em]">
                  Total Readers
                </p>
                <h3 className="font-headline-md text-headline-md text-primary">
                  {(stats?.totalReaders || 0).toLocaleString()}
                </h3>
              </div>

              {/* Newsletter Subscribers */}
              <div className="glass-card p-8">
                <p className="font-label-md text-on-surface-variant mb-6 uppercase tracking-[0.1em]">
                  Newsletter Subscribers
                </p>
                <h3 className="font-headline-md text-headline-md text-primary">
                  {(stats?.newsletterSubscribers || 0).toLocaleString()}
                </h3>
              </div>

              {/* Total Reviews */}
              <div className="glass-card p-8">
                <p className="font-label-md text-on-surface-variant mb-6 uppercase tracking-[0.1em]">
                  Reviews Received
                </p>
                <h3 className="font-headline-md text-headline-md text-primary">
                  {(stats?.totalReviews || 0).toLocaleString()}
                </h3>
              </div>

              {/* Average Rating */}
              <div className="glass-card p-8">
                <p className="font-label-md text-on-surface-variant mb-6 uppercase tracking-[0.1em]">
                  Average Rating
                </p>
                <h3 className="font-headline-md text-headline-md text-primary">
                  {(stats?.averageRating || 0).toFixed(1)}
                </h3>
                <div className="flex mt-2">
                  {[...Array(Math.floor(stats?.averageRating || 0))].map((_, i) => (
                    <span key={i} className="material-symbols-outlined notranslate text-primary-fixed-dim text-sm" translate="no" style={{ fontVariationSettings: "'FILL' 1" }}>
                      star
                    </span>
                  ))}
                  {stats && (stats.averageRating % 1 > 0) && (
                    <span className="material-symbols-outlined notranslate text-primary-fixed-dim text-sm" translate="no" style={{ fontVariationSettings: "'FILL' 1" }}>
                      star_half
                    </span>
                  )}
                </div>
              </div>
            </div>
          </section>

          {/* Reader Activity Chart */}
          <section className="admin-section glass-card p-10 mb-24 relative overflow-hidden">
            <div className="flex justify-between items-start mb-12">
              <div>
                <h4 className="font-headline-sm text-headline-sm text-primary mb-2">Reader Activity</h4>
                <p className="font-body-sm text-on-surface-variant">Daily active reading sessions</p>
              </div>
              <div className="flex gap-4">
                <button
                  onClick={() => setActivityPeriod('7d')}
                  className={`text-label-md pb-1 transition-colors ${
                    activityPeriod === '7d'
                      ? 'text-primary border-b border-primary'
                      : 'text-on-surface-variant hover:text-primary'
                  }`}
                >
                  Weekly
                </button>
                <button
                  onClick={() => setActivityPeriod('30d')}
                  className={`text-label-md pb-1 transition-colors ${
                    activityPeriod === '30d'
                      ? 'text-primary border-b border-primary'
                      : 'text-on-surface-variant hover:text-primary'
                  }`}
                >
                  Monthly
                </button>
                <button
                  onClick={() => setActivityPeriod('90d')}
                  className={`text-label-md pb-1 transition-colors ${
                    activityPeriod === '90d'
                      ? 'text-primary border-b border-primary'
                      : 'text-on-surface-variant hover:text-primary'
                  }`}
                >
                  Quarterly
                </button>
              </div>
            </div>

            <div className="h-64 w-full relative">
              {readerActivity?.chart && readerActivity.chart.length > 0 ? (
                <>
                  <svg className="w-full h-full overflow-visible" preserveAspectRatio="none" viewBox="0 0 1000 200">
                    <defs>
                      <linearGradient id="activityChartGradient" x1="0" x2="0" y1="0" y2="1">
                        <stop offset="0%" stopColor="white" stopOpacity="0.1" />
                        <stop offset="100%" stopColor="white" stopOpacity="0" />
                      </linearGradient>
                    </defs>
                    {generateActivityChartPath().hasData && (
                      <>
                        <path
                          className="opacity-80"
                          d={generateActivityChartPath().mainPath}
                          fill="none"
                          stroke="white"
                          strokeWidth="1.5"
                        />
                        <path
                          d={generateActivityChartPath().gradientPath}
                          fill="url(#activityChartGradient)"
                        />
                        {generateActivityChartPath().points.map((point, idx) => (
                          <circle key={idx} cx={point.x} cy={point.y} fill="white" r="3" />
                        ))}
                      </>
                    )}
                  </svg>

                  <div className="absolute -bottom-8 left-0 right-0 flex justify-between font-label-md text-label-md text-on-surface-variant/40">
                    {readerActivity.chart.map((dataPoint, idx) => (
                      <span key={idx} className="text-xs">
                        {new Date(dataPoint.label).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                        })}
                      </span>
                    ))}
                  </div>
                </>
              ) : (
                <div className="h-full flex items-center justify-center text-on-surface-variant">
                  No activity data available
                </div>
              )}
            </div>
          </section>

          {/* Latest Reviews Section */}
          <section className="admin-section mb-24">
            <div className="flex justify-between items-end mb-12">
              <h4 className="font-headline-sm text-headline-sm text-primary">Latest Reviews</h4>
            </div>
            
            {reviews.length > 0 ? (
              <div className="space-y-6">
                {reviews.map((review) => (
                  <div
                    key={review._id}
                    className="glass-card p-8 flex gap-8 items-start hover:bg-white/[0.03] transition-colors"
                  >
                    <img
                      src={review.userAvatar || 'https://via.placeholder.com/56x56?text=User'}
                      alt={review.userName}
                      className="w-14 h-14 object-cover grayscale opacity-80 border border-white/10 rounded-lg flex-shrink-0"
                    />
                    <div className="flex-1">
                      <div className="flex justify-between items-center mb-4">
                        <div>
                          <h5 className="font-headline-sm text-[20px] text-primary">{review.userName}</h5>
                          <p className="font-label-md text-on-surface-variant text-sm">{review.bookTitle}</p>
                        </div>
                        <div className="flex gap-1">
                          {[...Array(review.rating)].map((_, i) => (
                            <span
                              key={i}
                              className="material-symbols-outlined notranslate text-sm text-primary-fixed-dim"
                              translate="no"
                              style={{ fontVariationSettings: "'FILL' 1" }}
                            >
                              star
                            </span>
                          ))}
                          {review.rating < 5 && (
                            <span
                              className="material-symbols-outlined notranslate text-sm text-white/10"
                              translate="no"
                              style={{ fontVariationSettings: "'FILL' 1" }}
                            >
                              star
                            </span>
                          )}
                        </div>
                      </div>
                      <p className="italic font-body-md text-on-surface-variant leading-relaxed max-w-[800px]">
                        "{review.content}"
                      </p>
                      <p className="text-[10px] text-on-surface-variant uppercase tracking-widest mt-6 opacity-40">
                        {new Date(review.createdAt).toLocaleDateString()} • {review.isVerified ? 'Verified Purchase' : 'Digital Subscriber'}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="glass-card p-12 text-center">
                <span className="material-symbols-outlined notranslate text-6xl text-on-surface-variant opacity-30 mb-4 block" translate="no">
                  message
                </span>
                <p className="text-on-surface-variant font-body-md">No reviews yet.</p>
              </div>
            )}
          </section>

          {/* Top Readers Section */}
          <section className="admin-section mb-24">
            <h4 className="font-headline-sm text-headline-sm text-primary mb-12">Top Readers</h4>
            
            {topReaders.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-gutter">
                {topReaders.map((reader) => (
                  <div
                    key={reader._id}
                    className="border border-white/5 bg-white/[0.02] p-8 text-center group hover:bg-white/[0.05] transition-all rounded-xl"
                  >
                    <div className="relative w-20 h-20 mx-auto mb-6">
                      <img
                        src={reader.avatar || 'https://via.placeholder.com/80x80?text=Reader'}
                        alt={reader.name}
                        className="w-full h-full object-cover rounded-full grayscale group-hover:grayscale-0 transition-all duration-300"
                      />
                    </div>
                    <h5 className="font-headline-sm text-[18px] text-primary mb-6">{reader.name}</h5>
                    
                    <div className="space-y-4">
                      <div className="text-center pb-4 border-b border-white/5">
                        <p className="font-label-md text-on-surface-variant text-xs uppercase mb-1">Books Owned</p>
                        <p className="font-headline-md text-primary">{reader.booksOwned}</p>
                      </div>

                      <div className="text-center pb-4 border-b border-white/5">
                        <p className="font-label-md text-on-surface-variant text-xs uppercase mb-2">Reading Progress</p>
                        <p className="font-headline-md text-primary mb-2">{reader.readingProgress}%</p>
                        <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
                          <div className="bg-primary h-full" style={{ width: `${reader.readingProgress}%` }} />
                        </div>
                      </div>

                      <div className="text-center pt-2">
                        <p className="font-label-md text-on-surface-variant text-xs uppercase mb-1">Last Activity</p>
                        <p className="font-body-sm text-primary">{formatLastActivity(reader.lastActivityAt)}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="glass-card p-12 text-center">
                <span className="material-symbols-outlined notranslate text-6xl text-on-surface-variant opacity-30 mb-4 block" translate="no">
                  people
                </span>
                <p className="text-on-surface-variant font-body-md">No active readers found.</p>
              </div>
            )}
          </section>
        </>
      )}
    </>
  );
}
