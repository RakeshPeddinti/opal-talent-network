import React, { useState } from 'react';
import { Star } from 'lucide-react';
import { cn } from '../utils';

export interface StarRatingProps {
  rating: number; // 0 to 5
  maxStars?: number;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  interactive?: boolean;
  onChange?: (newRating: number) => void;
  showScore?: boolean;
  scoreLabel?: string;
  className?: string;
}

const RATING_DESCRIPTIONS: Record<number, string> = {
  1: 'Disappointing',
  2: 'Fair',
  3: 'Satisfactory',
  4: 'Very Good',
  5: 'Exceptional Luxury Experience'
};

export const StarRating: React.FC<StarRatingProps> = ({
  rating,
  maxStars = 5,
  size = 'md',
  interactive = false,
  onChange,
  showScore = false,
  scoreLabel,
  className
}) => {
  const [hoverRating, setHoverRating] = useState<number | null>(null);

  const activeRating = hoverRating !== null ? hoverRating : rating;

  const sizeClasses = {
    xs: 'w-3 h-3',
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6',
    xl: 'w-8 h-8'
  };

  const handleStarClick = (starIndex: number) => {
    if (interactive && onChange) {
      onChange(starIndex);
    }
  };

  return (
    <div className={cn("inline-flex items-center gap-2", className)}>
      <div className="flex items-center gap-1" role={interactive ? "radiogroup" : undefined} aria-label="Star rating">
        {Array.from({ length: maxStars }).map((_, i) => {
          const starNumber = i + 1;
          const isFilled = starNumber <= activeRating;
          const isPartiallyFilled = !isFilled && starNumber - 0.5 <= activeRating;

          return (
            <button
              key={starNumber}
              type="button"
              disabled={!interactive}
              onClick={() => handleStarClick(starNumber)}
              onMouseEnter={() => interactive && setHoverRating(starNumber)}
              onMouseLeave={() => interactive && setHoverRating(null)}
              className={cn(
                "transition-all duration-150 focus:outline-none",
                interactive ? "cursor-pointer transform hover:scale-125 focus-visible:ring-2 focus-visible:ring-brand-gold/60 rounded" : "cursor-default"
              )}
              aria-label={interactive ? `${starNumber} star${starNumber > 1 ? 's' : ''}` : undefined}
            >
              <Star
                className={cn(
                  sizeClasses[size],
                  "transition-colors",
                  isFilled
                    ? "fill-amber-400 text-amber-400 drop-shadow-[0_0_6px_rgba(251,191,36,0.5)]"
                    : isPartiallyFilled
                    ? "fill-amber-400/50 text-amber-400"
                    : "fill-transparent text-stone-300 dark:text-stone-700"
                )}
              />
            </button>
          );
        })}
      </div>

      {showScore && (
        <span className="text-xs font-bold text-brand-dark flex items-center gap-1">
          <span className="font-serif text-sm">{rating.toFixed(1)}</span>
          {scoreLabel && <span className="text-brand-muted text-[11px] font-normal">({scoreLabel})</span>}
        </span>
      )}

      {interactive && hoverRating !== null && (
        <span className="text-xs font-semibold text-brand-gold animate-fadeIn">
          {RATING_DESCRIPTIONS[hoverRating] || ''}
        </span>
      )}
    </div>
  );
};
