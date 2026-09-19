import styles from './CommunityFeed.module.css';

interface CommunityFeedProps {
  messages: string[];
}

export default function CommunityFeed({ messages }: CommunityFeedProps) {
  if (!messages.length) return null;

  const renderLine = (keyPrefix: string, hidden = false) => (
    <span className={styles.content} aria-hidden={hidden}>
      {messages.map((message, index) => (
        <span key={`${keyPrefix}-${index}`} className={styles.segment}>
          <span>{message}</span>
          <span className={styles.separator}>|</span>
        </span>
      ))}
    </span>
  );

  return (
    <div className={styles.feed} aria-label="Community feed">
      <div className={styles.track}>
        {/* Duplicated for seamless loop */}
        {renderLine('line-a', true)}
        {renderLine('line-b')}
      </div>
    </div>
  );
}
