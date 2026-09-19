import { useNavigate } from 'react-router-dom';
import type { ReactNode } from 'react';
import Card from './Card';
import MarkdownText from './MarkdownText';
import styles from './TaskCard.module.css';

interface TaskCardProps {
  title: string;
  description: string;
  content: string;
  imageUrl?: string;
  href?: string;
  actionLabel?: string;
  footer?: ReactNode;
  onClick?: () => void;
}

export default function TaskCard({
  title,
  description,
  content,
  imageUrl,
  href,
  actionLabel = 'Open task',
  footer,
  onClick,
}: TaskCardProps) {
  const navigate = useNavigate();
  const isInteractive = Boolean(href || onClick);

  function handleClick() {
    if (onClick) {
      onClick();
      return;
    }

    if (href) {
      if (href.startsWith('/')) {
        navigate(href);
        return;
      }

      window.location.assign(href);
    }
  }

  function handleKeyDown(event: React.KeyboardEvent) {
    if (!isInteractive) return;

    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      handleClick();
    }
  }

  return (
    <Card
      interactive={isInteractive}
      className={styles.card}
      onClick={isInteractive ? handleClick : undefined}
      onKeyDown={isInteractive ? handleKeyDown : undefined}
      role={isInteractive ? 'button' : undefined}
      tabIndex={isInteractive ? 0 : undefined}
      aria-label={isInteractive ? `${actionLabel}: ${title}` : title}
    >
      {imageUrl && (
        <div className={styles.image} style={{ backgroundImage: `url(${imageUrl})` }} />
      )}

      <div className={styles.body}>
        <div className={styles.text}>
          <h3 className={styles.title}>{title}</h3>
          <MarkdownText className={styles.description} content={description} />
          <MarkdownText className={styles.content} content={content} />
        </div>

        {footer && <div className={styles.footer}>{footer}</div>}
      </div>
    </Card>
  );
}