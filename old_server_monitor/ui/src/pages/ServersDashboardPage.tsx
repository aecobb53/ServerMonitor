import { useEffect, useMemo, useState } from 'react';
import { PageHeader, LoadingState, ErrorState, ServerCard } from '@/components/ui';
import type { Server } from '@/types/server';
import { api } from '@/api/client';
import { usePageTitle } from '@/hooks/usePageTitle';
import styles from './ServersDashboardPage.module.css';

interface ServerGroup {
  name: string;
  image: string;
  servers: Server[];
}

interface DashboardResponse {
  games: ServerGroup[];
  last_updated: string;
}

const REFRESH_MS = Number(import.meta.env.VITE_SERVER_DASHBOARD_REFRESH_MS ?? 15000);

export default function ServersDashboardPage() {
  usePageTitle('Servers');
  const [groups, setGroups] = useState<ServerGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadServers() {
      const response = await api.get<DashboardResponse>('/server-status');

      if (!cancelled && response.success) {
        setGroups(response.data.games ?? []);
        setError(null);
        setLoading(false);
        return;
      }

      if (!cancelled) {
        setError('Unable to load server information right now.');
        setLoading(false);
      }
    }

    loadServers();
    const interval = window.setInterval(loadServers, REFRESH_MS);

    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, []);

  const hasServers = useMemo(
    () => groups.some((group) => group.servers.length > 0),
    [groups],
  );

  if (loading) return <LoadingState message="Loading servers…" />;
  if (error) return <ErrorState message={error} />;

  return (
    <div className={styles.root}>
      <PageHeader
        title="Servers"
        subtitle="View the current status of every hosted game server."
      />

      {!hasServers ? (
        <p className={styles.empty}>No servers are currently available.</p>
      ) : (
        <div className={styles.groups}>
          {groups.map((group) =>
            group.servers.length ? (
              <section key={group.name} className={styles.group}>
                <h2 className={styles.groupTitle}>{group.name}</h2>
                <div className={styles.grid}>
                  {group.servers.map((server) => (
                    <ServerCard
                      key={server.id}
                      server={server}
                      description={server.last_message}
                      imageUrl={group.image}
                    />
                  ))}
                </div>
              </section>
            ) : null,
          )}
        </div>
      )}
    </div>
  );
}