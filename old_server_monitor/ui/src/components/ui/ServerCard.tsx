import { useNavigate } from 'react-router-dom';
import type { Server } from '@/types/server';
import Card from './Card';
import MarkdownText from './MarkdownText';
import StatusBadge from './StatusBadge';
import styles from './ServerCard.module.css';

interface ServerCardProps {
  server: Server;
  description?: string;
  imageUrl?: string;
}

export default function ServerCard({ server, description, imageUrl }: ServerCardProps) {
  const navigate = useNavigate();

  function handleClick() {
    navigate(`/servers/${encodeURIComponent(server.name)}`);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleClick();
    }
  }

  return (
    <Card
      interactive
      className={styles.card}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      role="button"
      tabIndex={0}
      aria-label={`View ${server.name} server`}
    >
      {/* Visual identifier */}
      <div
        className={styles.banner}
        style={imageUrl ? { backgroundImage: `url(${imageUrl})` } : undefined}
      >
        <span className={styles.gameName}>{server.game}</span>
      </div>

      {/* Card body */}
      <div className={styles.body}>
        <div className={styles.titleRow}>
          <h3 className={styles.name}>{server.name}</h3>
          <StatusBadge status={server.server_status} />
        </div>

        <MarkdownText className={styles.message} content={description ?? server.last_message} />
      </div>
    </Card>
  );
}
