import { useEffect, useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Navbar from './Navbar';
import { CommunityFeed } from '@/components/ui';
import { api } from '@/api/client';
import styles from './AppLayout.module.css';

const FALLBACK_MESSAGES = [
  '⚔ Welcome to the community server hub',
  '💡 Repair your gear before sailing',
  '🎉 More features coming soon',
];

export default function AppLayout() {
  const location = useLocation();
  const [messages, setMessages] = useState<string[]>(FALLBACK_MESSAGES);

  useEffect(() => {
    let cancelled = false;

    async function loadFeed() {
      const page = encodeURIComponent(location.pathname || '/');
      const response = await api.get<string[]>(`/feed?page=${page}`);

      if (!cancelled && response.success && Array.isArray(response.data)) {
        setMessages(response.data);
      }
    }

    loadFeed();

    return () => {
      cancelled = true;
    };
  }, [location.pathname]);

  return (
    <div className={styles.root}>
      <Navbar />
      <CommunityFeed messages={messages} />

      <main className={styles.main}>
        <Outlet />
      </main>
    </div>
  );
}
