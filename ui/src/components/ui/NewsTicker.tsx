import { useRef, useEffect, useState } from 'react';
import styles from './NewsTicker.module.css';

type TickerItemType = 'tip' | 'announcement' | 'event';

export interface TickerItem {
  type: TickerItemType;
  text: string;
}

interface NewsTickerProps {
  items: TickerItem[];
  /** Scroll speed in pixels per second. Default: 60 */
  speed?: number;
}

const TYPE_LABELS: Record<TickerItemType, string> = {
  tip: 'Tip',
  announcement: 'Announcement',
  event: 'Event',
};

const SEPARATOR = '·';

export default function NewsTicker({ items, speed = 60 }: NewsTickerProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [duration, setDuration] = useState(20);

  // Duplicate items for seamless looping
  const displayed = [...items, ...items];

  useEffect(() => {
    if (trackRef.current) {
      const width = trackRef.current.scrollWidth / 2; // half = one copy
      setDuration(width / speed);
    }
  }, [items, speed]);

  if (items.length === 0) return null;

  return (
    <div className={styles.ticker} aria-label="News ticker" aria-live="off">
      <div className={styles.label}>News</div>
      <div className={styles.window}>
        <div
          ref={trackRef}
          className={styles.track}
          style={{ animationDuration: `${duration}s` }}
        >
          {displayed.map((item, i) => (
            <span key={i} className={styles.item}>
              <span className={[styles.typeLabel, styles[item.type]].join(' ')}>
                {TYPE_LABELS[item.type]}
              </span>
              <span className={styles.text}>{item.text}</span>
              <span className={styles.separator} aria-hidden="true">{SEPARATOR}</span>
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
