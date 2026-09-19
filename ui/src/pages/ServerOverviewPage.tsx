import { useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import { api } from '@/api/client';
import MarkdownText from '@/components/ui/MarkdownText';
import { Card, ErrorState, FeaturedCarousel, LoadingState, PageHeader, StatusBadge } from '@/components/ui';
import type { CarouselSlide } from '@/components/ui/FeaturedCarousel';
import type { ServerInfo } from '@/types/server';
import { usePageTitle } from '@/hooks/usePageTitle';
import styles from './ServerOverviewPage.module.css';

type CarouselApiItem =
  | string
  | {
      id?: string;
      image?: string;
      alt?: string;
      title?: string;
      subtitle?: string;
      href?: string;
    };

function mapCarouselItems(items: CarouselApiItem[]): CarouselSlide[] {
  return items
    .map((item, index) => {
      if (typeof item === 'string') {
        return {
          id: `slide-${index}`,
          alt: item,
          title: item,
        };
      }

      return {
        id: item.id ?? `slide-${index}`,
        image: item.image,
        alt: item.alt ?? item.title ?? `Slide ${index + 1}`,
        title: item.title,
        subtitle: item.subtitle,
        href: item.href,
      };
    })
    .filter((slide) => Boolean(slide.alt));
}

const REFRESH_MS = Number(import.meta.env.VITE_PAGE_REFRESH_MS ?? 15000);

export default function ServerOverviewPage() {
  const { name } = useParams<{ name: string }>();
  const location = useLocation();
  const [server, setServer] = useState<ServerInfo | null>(null);
  const [serverNews, setServerNews] = useState<string[]>([]);
  const [serverRules, setServerRules] = useState<string[]>([]);
  const [slides, setSlides] = useState<CarouselSlide[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  usePageTitle(server?.display_name ?? name ?? 'Server');

  useEffect(() => {
    let cancelled = false;

    async function loadServer(showLoading = false) {
      if (showLoading) {
        setLoading(true);
      }

      if (!name) {
        if (!cancelled) {
          setError('No server was selected.');
          setLoading(false);
        }
        return;
      }

      const response = await api.get<ServerInfo>(`/server-info/${encodeURIComponent(name)}`);

      if (cancelled) {
        return;
      }

      if (response.success) {
        setServer(response.data);
        setError(null);
      } else {
        setError(response.error.message);
      }

      setLoading(false);
    }

    loadServer(true);
    const interval = window.setInterval(() => {
      void loadServer();
    }, REFRESH_MS);

    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, [name]);

  useEffect(() => {
    let cancelled = false;

    async function loadServerRules() {
      if (!name) {
        if (!cancelled) {
          setServerRules([]);
        }
        return;
      }

      const response = await api.get<string[]>(`/servers/${encodeURIComponent(name)}/rules`);

      if (cancelled) {
        return;
      }

      if (response.success && Array.isArray(response.data)) {
        setServerRules(response.data);
      } else {
        setServerRules([]);
      }
    }

    loadServerRules();

    const interval = window.setInterval(() => {
      void loadServerRules();
    }, REFRESH_MS);

    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, [name]);

  useEffect(() => {
    let cancelled = false;

    async function loadServerNews() {
      if (!name) {
        if (!cancelled) {
          setServerNews([]);
        }
        return;
      }

      const response = await api.get<string[]>(`/servers/${encodeURIComponent(name)}/news`);

      if (cancelled) {
        return;
      }

      if (response.success && Array.isArray(response.data)) {
        setServerNews(response.data);
      } else {
        setServerNews([]);
      }
    }

    loadServerNews();

    const interval = window.setInterval(() => {
      void loadServerNews();
    }, REFRESH_MS);

    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, [name]);

  useEffect(() => {
    let cancelled = false;

    async function loadCarousel() {
      const page = encodeURIComponent(location.pathname || '/');
      const response = await api.get<CarouselApiItem[]>(`/carousel?page=${page}`);

      if (!cancelled && response.success && Array.isArray(response.data)) {
        const mapped = mapCarouselItems(response.data);
        if (mapped.length) {
          setSlides(mapped);
        } else {
          setSlides([]);
        }
      }
    }

    loadCarousel();

    const interval = window.setInterval(() => {
      void loadCarousel();
    }, REFRESH_MS);

    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, [location.pathname]);

  const latestStatus = server && server.server_status_list.length
    ? server.server_status_list[server.server_status_list.length - 1]
    : undefined;
  const recentStatusEntries = server ? server.server_status_list.slice(-20).reverse() : [];
  const quickLinks = useMemo(() => {
    if (!server) {
      return [];
    }

    const serverFilter = `server=${encodeURIComponent(server.server_name)}`;

    return [
      { label: 'Events', to: `/events?${serverFilter}` },
      { label: 'Gallery', to: `/gallery?${serverFilter}` },
      { label: 'Maps', to: `/maps?${serverFilter}` },
      { label: 'Requests', to: `/requests?${serverFilter}` },
    ];
  }, [server]);

  if (loading) {
    return <LoadingState message="Loading server overview…" />;
  }

  if (error || !server) {
    return <ErrorState message={error ?? 'Unable to load server overview.'} />;
  }

  return (
    <div className={styles.root}>
      {slides.length > 0 && (
        <section className={styles.hero}>
          <FeaturedCarousel slides={slides} />
        </section>
      )}

      <PageHeader
        title={server.display_name}
        subtitle={server.description}
      />

      <div className={styles.content}>
        <div className={styles.column}>
          <Card className={styles.summary}>
            <div className={styles.summaryRow}>
              <div>
                <p className={styles.label}>Game</p>
                <p className={styles.value}>{server.game}</p>
              </div>
              <div>
                <p className={styles.label}>Container</p>
                <p className={styles.value}>{server.container_status}</p>
              </div>
              <div>
                <p className={styles.label}>Display Status</p>
                <StatusBadge status={server.display_status} />
              </div>
              <div>
                <p className={styles.label}>Updated</p>
                <p className={styles.value}>{server.timestamp}</p>
              </div>
            </div>

            <div className={styles.summaryNote}>
              <p className={styles.label}>Latest Update</p>
              <MarkdownText className={styles.value} content={latestStatus?.message ?? 'No recent updates have been recorded yet.'} />
            </div>
          </Card>

          <Card className={styles.section}>
            <h2 className={styles.sectionTitle}>Quick Links</h2>
            <div className={styles.linkGrid}>
              {quickLinks.map((link) => (
                <Link key={link.label} to={link.to} className={styles.linkCard}>
                  {link.label}
                </Link>
              ))}
            </div>
          </Card>

          <Card className={styles.section}>
            <h2 className={styles.sectionTitle}>Recent News</h2>
            {serverNews.length > 0 ? (
              <ul className={styles.newsList}>
                {serverNews.map((item, index) => (
                  <li key={`${item}-${index}`} className={styles.newsItem}>
                    <MarkdownText content={item} />
                  </li>
                ))}
              </ul>
            ) : (
              <p className={styles.value}>No news has been posted for this server yet.</p>
            )}
          </Card>
        </div>

        <div className={styles.column}>
          <Card className={styles.section}>
            <h2 className={styles.sectionTitle}>Rules</h2>
            {serverRules.length > 0 ? (
              <ul className={styles.list}>
                {serverRules.map((item, index) => (
                  <li key={`${item}-${index}`}>
                    <MarkdownText content={item} />
                  </li>
                ))}
              </ul>
            ) : (
              <p className={styles.value}>No rules have been posted for this server yet.</p>
            )}
          </Card>

          <Card className={styles.section}>
            <details className={styles.details}>
              <summary className={styles.detailsSummary}>Server Logs</summary>
              <div className={styles.logList}>
                {recentStatusEntries.map((entry) => (
                  <div key={`${entry.timestamp}-${entry.status}`} className={styles.logEntry}>
                    <span className={styles.logTime}>{entry.timestamp}</span>
                    <div className={styles.logHeader}>
                      <StatusBadge status={entry.status} />
                    </div>
                    <MarkdownText className={styles.logBody} content={entry.message} />
                  </div>
                ))}
              </div>
            </details>
          </Card>
        </div>
      </div>
    </div>
  );
}
