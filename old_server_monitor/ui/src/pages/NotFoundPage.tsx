import { Link } from 'react-router-dom';
import { usePageTitle } from '@/hooks/usePageTitle';
import styles from './NotFoundPage.module.css';

export default function NotFoundPage() {
  usePageTitle('Not Found');
  return (
    <div className={styles.root}>
      <h1 className={styles.code}>404</h1>
      <p className={styles.message}>This page doesn't exist.</p>
      <Link to="/" className={styles.link}>Go home</Link>
    </div>
  );
}
