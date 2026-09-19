import Card from './Card';
import MarkdownText from './MarkdownText';
import TrustedExternalLink from './TrustedExternalLink';
import styles from './EventCard.module.css';

export interface EventItem {
  id: string;
  server: string;
  title: string;
  description: string;
  event_date: string | null;
  start_time: string | null;
  end_time: string | null;
  meetup_location: string | null;
  expanded_details: string | null;
  image_url: string | null;
  quick_links?: EventQuickLink[];
  created_at: string;
}

export interface EventQuickLink {
  display: string;
  url: string;
}

interface EventCardProps {
  event: EventItem;
  onOpen: () => void;
  onCopyLink: () => void;
  onEdit: () => void;
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

function PencilIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M17 3a2.83 2.83 0 1 1 4 4L7.5 20.5 3 22l1.5-4.5Z" />
    </svg>
  );
}

export function formatEventSchedule(
  eventDate: string | null,
  startTime: string | null,
  endTime: string | null,
): string | null {
  if (!eventDate) return null;

  const [year, month, day] = eventDate.split('-').map(Number);

  if (startTime) {
    const [hours, minutes] = startTime.split(':').map(Number);
    const utcDate = new Date(Date.UTC(year, month - 1, day, hours, minutes));

    const dateStr = utcDate.toLocaleDateString(undefined, {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
    });
    const timeStr = utcDate.toLocaleTimeString(undefined, {
      hour: 'numeric',
      minute: '2-digit',
      timeZoneName: 'short',
    });

    if (endTime) {
      const [endHours, endMinutes] = endTime.split(':').map(Number);
      const utcEnd = new Date(Date.UTC(year, month - 1, day, endHours, endMinutes));
      const endTimeStr = utcEnd.toLocaleTimeString(undefined, {
        hour: 'numeric',
        minute: '2-digit',
        timeZoneName: 'short',
      });
      return `${dateStr} · ${timeStr} – ${endTimeStr}`;
    }

    return `${dateStr} · ${timeStr}`;
  }

  // Date only — no timezone conversion needed
  const dateObj = new Date(year, month - 1, day);
  return dateObj.toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });
}

export default function EventCard({ event, onOpen, onCopyLink, onEdit, copied }: EventCardProps) {
  const schedule = formatEventSchedule(event.event_date, event.start_time, event.end_time);
  const quickLinks = event.quick_links ?? [];

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
      aria-label={`View event: ${event.title}`}
    >
      {event.image_url && (
        <div className={styles.imageWrapper}>
          <img className={styles.image} src={event.image_url} alt="" />
        </div>
      )}
      <div className={styles.content}>
        <div className={styles.titleRow}>
          <h3 className={styles.title}>{event.title}</h3>
          <div className={styles.actionButtons}>
            <button
              type="button"
              className={styles.iconButton}
              onClick={(e) => { e.stopPropagation(); onEdit(); }}
              aria-label="Edit this event"
              title="Edit event"
            >
              <PencilIcon />
            </button>
            <button
              type="button"
              className={styles.iconButton}
              onClick={(e) => { e.stopPropagation(); onCopyLink(); }}
              aria-label="Copy link to this event"
              title={copied ? 'Copied!' : 'Copy link'}
            >
              <LinkIcon />
              {copied && <span className={styles.copiedLabel}>Copied!</span>}
            </button>
          </div>
        </div>

        <MarkdownText className={styles.description} content={event.description} />

        {schedule && <p className={styles.schedule}>{schedule}</p>}
        {event.meetup_location && (
          <p className={styles.location}>📍 {event.meetup_location}</p>
        )}

        {quickLinks.length > 0 && (
          <div className={styles.quickLinksSection}>
            <p className={styles.quickLinksTitle}>Quick Links</p>
            <div className={styles.linkGrid}>
              {quickLinks.map((link) => (
                <TrustedExternalLink
                  key={`${event.id}-${link.display}-${link.url}`}
                  href={link.url}
                  className={styles.linkCard}
                  onClick={(e) => e.stopPropagation()}
                >
                  {link.display}
                </TrustedExternalLink>
              ))}
            </div>
          </div>
        )}

        <div className={styles.footer}>
          <span className={styles.serverBadge}>{event.server}</span>
        </div>
      </div>
    </Card>
  );
}
