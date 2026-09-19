import Card from './Card';
import styles from './GalleryCard.module.css';

export interface GalleryItem {
  id: string;
  server: string;
  title: string | null;
  description: string | null;
  media_count: number;
  preview_url: string;
  media_urls: string[];
  created_at: string;
}

interface GalleryCardProps {
  item: GalleryItem;
  onOpen: () => void;
  onCopyLink: () => void;
  copied: boolean;
}

function LinkIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
    </svg>
  );
}

export default function GalleryCard({ item, onOpen, onCopyLink, copied }: GalleryCardProps) {
  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onOpen();
    }
  }

  return (
    <Card
      interactive
      className={styles.card}
      onClick={onOpen}
      onKeyDown={handleKeyDown}
      role="button"
      tabIndex={0}
      aria-label={`View gallery entry${item.title ? `: ${item.title}` : ''}`}
    >
      <div className={styles.imageWrapper}>
        <img className={styles.image} src={item.preview_url} alt={item.title ?? 'Gallery image'} />
        {item.media_count > 1 && (
          <span className={styles.mediaCount}>{item.media_count} images</span>
        )}
      </div>

      <div className={styles.content}>
        {item.title && <p className={styles.title}>{item.title}</p>}
        <div className={styles.footer}>
          <span className={styles.serverBadge}>{item.server}</span>
          <button
            type="button"
            className={styles.copyButton}
            onClick={(e) => { e.stopPropagation(); onCopyLink(); }}
            aria-label="Copy link to this gallery entry"
            title={copied ? 'Copied!' : 'Copy link'}
          >
            <LinkIcon />
            {copied && <span className={styles.copiedLabel}>Copied!</span>}
          </button>
        </div>
      </div>
    </Card>
  );
}
