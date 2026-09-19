import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { FeaturedCarousel, Card } from '@/components/ui';
import MarkdownText from '@/components/ui/MarkdownText';
import type { CarouselSlide } from '@/components/ui/FeaturedCarousel';
import { api } from '@/api/client';
import { usePageTitle } from '@/hooks/usePageTitle';
import styles from './HomePage.module.css';

const DEFAULT_SLIDES: CarouselSlide[] = [
  {
    id: 'placeholder-1',
    alt: 'Community screenshot',
    title: 'Welcome to the Server Hub',
    subtitle: 'Your home for community events, servers, and shared adventures.',
  },
  {
    id: 'placeholder-2',
    alt: 'Community screenshot 2',
    title: 'Something epic is always happening',
    subtitle: "Check the events page to see what's coming up.",
  },
];

const DEFAULT_WHATS_NEW = [
  { id: '1', text: '🗺 New server world started — jump in and explore.' },
  { id: '2', text: '⚔ Boss fight night is coming — check the Events page.' },
  { id: '3', text: '📸 Gallery updated with fresh community screenshots.' },
];

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

const NAV_CARDS = [
  { to: '/events',  label: 'Events',  icon: '📅', description: 'Upcoming battles, raids, and community nights.' },
  { to: '/gallery', label: 'Gallery', icon: '🖼', description: 'Screenshots and highlights from the community.' },
  { to: '/requests', label: 'Requests', icon: '📋', description: 'Community goals and shared requests.' },
  { to: '/servers', label: 'Servers', icon: '⚔', description: 'View all game servers and their current status.' },
];

const REFRESH_MS = Number(import.meta.env.VITE_PAGE_REFRESH_MS ?? 15000);

export default function HomePage() {
  usePageTitle();
  const location = useLocation();
  const navigate = useNavigate();
  const [slides, setSlides] = useState<CarouselSlide[]>(DEFAULT_SLIDES);
  const [whatsNew, setWhatsNew] = useState<string[]>([]);

  const whatsNewItems = useMemo(
    () => (whatsNew.length ? whatsNew : DEFAULT_WHATS_NEW.map((item) => item.text)),
    [whatsNew],
  );

  useEffect(() => {
    let cancelled = false;

    async function loadHomeContent() {
      const page = encodeURIComponent(location.pathname || '/');

      const [carouselResponse, newsResponse] = await Promise.all([
        api.get<CarouselApiItem[]>(`/carousel?page=${page}`),
        api.get<string[]>('/whats-new'),
      ]);

      if (!cancelled && carouselResponse.success && Array.isArray(carouselResponse.data)) {
        const mapped = mapCarouselItems(carouselResponse.data);
        if (mapped.length) {
          setSlides(mapped);
        }
      }

      if (!cancelled && newsResponse.success && Array.isArray(newsResponse.data)) {
        setWhatsNew(newsResponse.data);
      }
    }

    loadHomeContent();

    const interval = window.setInterval(() => {
      void loadHomeContent();
    }, REFRESH_MS);

    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, [location.pathname]);

  return (
    <div className={styles.root}>

      {/* Featured Carousel */}
      <section className={styles.carouselSection}>
        <FeaturedCarousel slides={slides} />
      </section>

      {/* Welcome */}
      <section className={styles.welcome}>
        <h1 className={styles.welcomeTitle}>Welcome back</h1>
        <p className={styles.welcomeText}>
          Stay up to date with events, projects, screenshots, and everything
          happening across Becomin' Subs servers.
        </p>
      </section>

      {/* What's New */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>What's New</h2>
        <ul className={styles.newsList}>
          {whatsNewItems.map((item) => (
            <li key={item} className={styles.newsItem}>
              <MarkdownText content={item} />
            </li>
          ))}
        </ul>
      </section>

      {/* Navigation Cards */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Explore</h2>
        <div className={styles.navGrid}>
          {NAV_CARDS.map(({ to, label, icon, description }) => (
            <Card
              key={to}
              interactive
              className={styles.navCard}
              onClick={() => navigate(to)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  navigate(to);
                }
              }}
              aria-label={`Go to ${label}`}
            >
              <span className={styles.navIcon}>{icon}</span>
              <h3 className={styles.navLabel}>{label}</h3>
              <p className={styles.navDescription}>{description}</p>
            </Card>
          ))}
        </div>
      </section>

    </div>
  );
}
