import { useState, useEffect, useRef } from 'react';
import { type ReviewItem } from '../services/reviews';

interface ReviewCarouselProps {
  reviews: ReviewItem[];
  totalCount: number;
  avgRating: number;
  onOpenModal: () => void;
}

export default function ReviewCarousel({ reviews, totalCount, avgRating, onOpenModal }: ReviewCarouselProps) {
  const [index, setIndex] = useState(0);
  const [fadeIn, setFadeIn] = useState(true);
  const timerRef = useRef<ReturnType<typeof setInterval>>(undefined);
  const isHovering = useRef(false);

  useEffect(() => {
    if (reviews.length === 0) return;
    timerRef.current = setInterval(() => {
      if (isHovering.current) return;
      setFadeIn(false);
      setTimeout(() => {
        setIndex(prev => (prev + 1) % reviews.length);
        setFadeIn(true);
      }, 300);
    }, 4000);
    return () => clearInterval(timerRef.current);
  }, [reviews.length]);

  // Reset index if reviews change
  useEffect(() => {
    setIndex(0);
    setFadeIn(true);
  }, [reviews]);

  const review = reviews[index];

  return (
    <div className="space-y-4">
      <button
        onClick={onOpenModal}
        className="flex items-center gap-2 w-full text-left hover:opacity-80 transition-opacity"
      >
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
      </button>

      <div
        onClick={onOpenModal}
        onMouseEnter={() => { isHovering.current = true; }}
        onMouseLeave={() => { isHovering.current = false; }}
        className="cursor-pointer"
      >
        {review ? (
          <div
            className="p-4 rounded-xl border border-white/10 bg-surface-container space-y-3 transition-opacity duration-300"
            style={{ opacity: fadeIn ? 1 : 0 }}
          >
            <div className="flex items-center gap-2 min-w-0">
              <span className="text-body-sm font-medium text-primary truncate">{review.userName}</span>
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
        ) : (
          <div className="p-4 rounded-xl border border-dashed border-accent-gold/40 bg-surface-container flex flex-col items-center justify-center gap-3 min-h-[140px] transition-opacity duration-300">
            <span className="material-symbols-outlined text-3xl text-on-surface-variant/50">rate_review</span>
            <p className="text-body-md text-on-surface-variant text-center">Sé el primero en opinar</p>
            <p className="text-label-sm text-primary">Dejá tu opinión</p>
          </div>
        )}
      </div>


    </div>
  );
}
