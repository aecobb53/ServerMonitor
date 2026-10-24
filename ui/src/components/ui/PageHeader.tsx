import type { ReactNode } from 'react';
import MarkdownText from './MarkdownText';
import styles from './PageHeader.module.css';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  /** Optional actions rendered on the right (e.g. a Button) */
  actions?: ReactNode;
}

export default function PageHeader({ title, subtitle, actions }: PageHeaderProps) {
  return (
    <div className={styles.header}>
      <div className={styles.text}>
        <h1 className={styles.title}>{title}</h1>
        {subtitle && <MarkdownText content={subtitle} />}
      </div>
      {actions && <div className={styles.actions}>{actions}</div>}
    </div>
  );
}
