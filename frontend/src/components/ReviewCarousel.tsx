import { useRef, useState } from 'react';
import { type ReviewItem } from '../services/reviews';

interface ReviewCarouselProps {
  reviews: ReviewItem[];
  totalCount: number;
  avgRating: number;
  onOpenModal: () => void;
}

export default function ReviewCarousel({ reviews, totalCount, avgRating, onOpenModal }: ReviewCarouselProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  const scroll = (direction: 'left' | 'right') => {
    if (!scrollRef.current) return;
    scrollRef.current.scrollBy({ left: direction === 'left' ? -340 : 340, behavior: 'smooth' });
  };

  const updateActiveIndex = () => {
    if (!scrollRef.current) return;
    const idx = Math.round(scrollRef.current.scrollLeft / scrollRef.current.clientWidth);
    setActiveIndex(Math.max(0, Math.min(idx, reviews.length)));
  };

  const totalCards = reviews.length + 1;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <h3 className="text-headline-md font-bold">Opiniones</h3>
        <span className="text-headline-sm font-bold text-accent-gold">{avgRating.toFixed(1)}</span>
        <div className="flex gap-0.5">
          {Array.from({ length: 5 }, (_, i) => (
            <span key={i} className={`material-symbols-outlined text-sm ${i < Math.round(avgRating) ? 'text-accent-gold' : 'text-on-surface-variant/30'}`}>
              star
            </span>
          ))}
        </div>
        <span className="text-label-sm text-on-surface-variant">({totalCount})</span>
      </div>

      <div className="relative group">
        <button
          onClick={() => scroll('left')}
          className="hidden md:flex absolute left-0 top-1/2 -translate-y-1/2 -translate-x-3 z-10 w-10 h-10 rounded-full bg-surface-container border border-white/10 items-center justify-center text-on-surface-variant hover:text-on-surface hover:border-white/20 transition-all opacity-0 group-hover:opacity-100 disabled:opacity-0"
          disabled={activeIndex === 0}
        >
          <span className="material-symbols-outlined text-lg">chevron_left</span>
        </button>
        <button
          onClick={() => scroll('right')}
          className="hidden md:flex absolute right-0 top-1/2 -translate-y-1/2 translate-x-3 z-10 w-10 h-10 rounded-full bg-surface-container border border-white/10 items-center justify-center text-on-surface-variant hover:text-on-surface hover:border-white/20 transition-all opacity-0 group-hover:opacity-100 disabled:opacity-0"
          disabled={activeIndex >= totalCards - 1}
        >
          <span className="material-symbols-outlined text-lg">chevron_right</span>
        </button>

        <div
          ref={scrollRef}
          onScroll={updateActiveIndex}
          className="flex gap-4 overflow-x-auto scroll-smooth"
          style={{
            scrollSnapType: 'x mandatory',
            scrollbarWidth: 'none',
            msOverflowStyle: 'none',
            WebkitOverflowScrolling: 'touch',
          }}
        >
          {reviews.map(review => (
            <div
              key={review.id}
              className="flex-shrink-0 w-[80vw] md:w-[340px] p-4 rounded-xl border border-white/10 bg-surface-container space-y-3"
              style={{ scrollSnapAlign: 'start' }}
            >
              <div className="flex items-center gap-2 min-w-0">
                <span className="text-body-sm font-medium text-primary truncate">{review.userName}</span>
                {review.verified && (
                  <span className="flex items-center gap-0.5 text-label-xs text-green-400 shrink-0">
                    <span className="material-symbols-outlined text-sm">check_circle</span>
                  </span>
                )}
              </div>
              <div className="flex gap-0.5">
                {Array.from({ length: 5 }, (_, i) => (
                  <span key={i} className={`material-symbols-outlined text-sm ${i < review.rating ? 'text-accent-gold' : 'text-on-surface-variant/30'}`}>
                    star
                  </span>
                ))}
              </div>
              {review.comment && (
                <p className="text-body-sm text-on-surface-variant leading-relaxed line-clamp-3">{review.comment}</p>
              )}
              <p className="text-label-xs text-on-surface-variant">
                {new Date(review.createdAt).toLocaleDateString('es-ES', { dateStyle: 'long' })}
              </p>
            </div>
          ))}

          {/* CTA Card */}
          <div
            className="flex-shrink-0 w-[80vw] md:w-[340px] p-4 rounded-xl border border-dashed border-accent-gold/40 bg-surface-container flex flex-col items-center justify-center gap-3 cursor-pointer hover:border-accent-gold/70 transition-colors"
            style={{ scrollSnapAlign: 'start' }}
            onClick={onOpenModal}
          >
            {totalCount > 0 ? (
              <>
                <span className="material-symbols-outlined text-3xl text-accent-gold">rate_review</span>
                <p className="text-body-md font-medium text-primary text-center">Ver todas las opiniones</p>
                <p className="text-label-sm text-on-surface-variant">{totalCount} opiniones</p>
              </>
            ) : (
              <>
                <span className="material-symbols-outlined text-3xl text-on-surface-variant/50">rate_review</span>
                <p className="text-body-md text-on-surface-variant text-center">Sé el primero en opinar</p>
                <p className="text-label-sm text-primary">Dejá tu opinión</p>
              </>
            )}
          </div>
        </div>
      </div>

      {totalCards > 1 && (
        <div className="flex items-center justify-center gap-1.5">
          {Array.from({ length: totalCards }, (_, i) => (
            <button
              key={i}
              onClick={() => {
                if (!scrollRef.current) return;
                const cardEl = scrollRef.current.children[i] as HTMLElement;
                if (cardEl) cardEl.scrollIntoView({ behavior: 'smooth', inline: 'start' });
              }}
              className={`w-2 h-2 rounded-full transition-all ${i === activeIndex ? 'bg-primary w-4' : 'bg-on-surface-variant/30 hover:bg-on-surface-variant/50'}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
