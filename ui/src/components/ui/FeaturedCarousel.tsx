import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './FeaturedCarousel.module.css';

export interface CarouselSlide {
  id: string;
  image?: string;
  alt: string;
  title?: string;
  subtitle?: string;
  href?: string;
}

interface FeaturedCarouselProps {
  slides: CarouselSlide[];
  autoRotate?: boolean;
  interval?: number;
  showIndicators?: boolean;
  showNavigation?: boolean;
  maxSlides?: number;
}

export default function FeaturedCarousel({
  slides,
  autoRotate = true,
  interval = 5000,
  showIndicators = true,
  showNavigation = true,
  maxSlides,
}: FeaturedCarouselProps) {
  const navigate = useNavigate();
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const visibleSlides = useMemo(
    () => (typeof maxSlides === 'number' ? slides.slice(0, maxSlides) : slides),
    [maxSlides, slides],
  );

  const next = useCallback(() => {
    setActive((i) => (i + 1) % visibleSlides.length);
  }, [visibleSlides.length]);

  const prev = useCallback(() => {
    setActive((i) => (i - 1 + visibleSlides.length) % visibleSlides.length);
  }, [visibleSlides.length]);

  const activateSlide = useCallback(
    (slide: CarouselSlide) => {
      if (!slide.href) return;

      if (slide.href.startsWith('/')) {
        navigate(slide.href);
        return;
      }

      window.location.assign(slide.href);
    },
    [navigate],
  );

  useEffect(() => {
    if (!autoRotate || paused || visibleSlides.length <= 1) return;
    timerRef.current = setInterval(next, interval);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [autoRotate, paused, interval, next, visibleSlides.length]);

  if (!visibleSlides.length) return null;

  const slide = visibleSlides[active];

  return (
    <div
      className={styles.carousel}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
          setPaused(false);
        }
      }}
    >
      {/* Slides */}
      <div className={styles.track} style={{ transform: `translateX(-${active * 100}%)` }}>
        {visibleSlides.map((s) => (
          <div
            key={s.id}
            className={[styles.slide, s.href ? styles.slideClickable : ''].join(' ')}
            style={s.image ? { backgroundImage: `url(${s.image})` } : undefined}
            aria-label={s.alt}
            role={s.href ? 'link' : 'img'}
            tabIndex={s.href ? 0 : -1}
            onClick={() => activateSlide(s)}
            onKeyDown={(event) => {
              if (!s.href) return;
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                activateSlide(s);
              }
            }}
          >
            {!s.image && <div className={styles.placeholder} />}
          </div>
        ))}
      </div>

      {/* Text overlay */}
      {(slide.title || slide.subtitle) && (
        <div className={styles.overlay}>
          {slide.title && <h2 className={styles.title}>{slide.title}</h2>}
          {slide.subtitle && <p className={styles.subtitle}>{slide.subtitle}</p>}
        </div>
      )}

      {/* Previous / Next */}
      {showNavigation && visibleSlides.length > 1 && (
        <>
          <button
            className={[styles.navBtn, styles.navPrev].join(' ')}
            onClick={prev}
            aria-label="Previous slide"
          >
            ‹
          </button>
          <button
            className={[styles.navBtn, styles.navNext].join(' ')}
            onClick={next}
            aria-label="Next slide"
          >
            ›
          </button>
        </>
      )}

      {/* Dot indicators */}
      {showIndicators && visibleSlides.length > 1 && (
        <div className={styles.indicators} aria-label="Slide indicators">
          {visibleSlides.map((s, i) => (
            <button
              key={s.id}
              className={[styles.dot, i === active ? styles.dotActive : ''].join(' ')}
              onClick={() => setActive(i)}
              aria-label={`Go to slide ${i + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
