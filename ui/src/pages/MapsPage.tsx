import { useCallback, useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { api } from '@/api/client';
import MarkdownText from '@/components/ui/MarkdownText';
import { LoadingState, ErrorState, PageHeader } from '@/components/ui';
import { usePageTitle } from '@/hooks/usePageTitle';
import styles from './MapsPage.module.css';

interface LegendItem {
  symbol: string;
  label: string;
}

interface MapData {
  server: string;
  description: string;
  last_updated: string;
  image_url: string;
  legend: LegendItem[];
}

const MIN_SCALE = 0.5;
const MAX_SCALE = 8;
const ZOOM_SENSITIVITY = 0.001;
const REFRESH_MS = Number(import.meta.env.VITE_PAGE_REFRESH_MS ?? 15000);

function ResetIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
      <path d="M3 3v5h5" />
    </svg>
  );
}

function FullscreenIcon({ active }: { active: boolean }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {active ? (
        <>
          <path d="M8 3v3a2 2 0 0 1-2 2H3" />
          <path d="M21 8h-3a2 2 0 0 1-2-2V3" />
          <path d="M3 16h3a2 2 0 0 1 2 2v3" />
          <path d="M16 21v-3a2 2 0 0 1 2-2h3" />
        </>
      ) : (
        <>
          <path d="M3 7V3h4" />
          <path d="M21 7V3h-4" />
          <path d="M3 17v4h4" />
          <path d="M21 17v4h-4" />
        </>
      )}
    </svg>
  );
}

function LegendIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <line x1="8" y1="6" x2="21" y2="6" />
      <line x1="8" y1="12" x2="21" y2="12" />
      <line x1="8" y1="18" x2="21" y2="18" />
      <line x1="3" y1="6" x2="3.01" y2="6" />
      <line x1="3" y1="12" x2="3.01" y2="12" />
      <line x1="3" y1="18" x2="3.01" y2="18" />
    </svg>
  );
}

function formatLastUpdated(iso: string): string {
  const date = new Date(iso);
  return date.toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });
}

export default function MapsPage() {
  usePageTitle('Map');
  const [searchParams] = useSearchParams();
  const serverParam = searchParams.get('server');

  const [mapData, setMapData] = useState<MapData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [scale, setScale] = useState(1);
  const [translate, setTranslate] = useState({ x: 0, y: 0 });
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showLegendOverlay, setShowLegendOverlay] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const dragState = useRef<{ startX: number; startY: number; startTx: number; startTy: number } | null>(null);
  const pointersRef = useRef<Map<number, { x: number; y: number }>>(new Map());
  const pinchState = useRef<{ distance: number; scale: number } | null>(null);

  // ── Fullscreen listener ───────────────────────
  useEffect(() => {
    function onFullscreenChange() {
      setIsFullscreen(Boolean(document.fullscreenElement));
      if (!document.fullscreenElement) setShowLegendOverlay(false);
    }
    document.addEventListener('fullscreenchange', onFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', onFullscreenChange);
  }, []);

  // ── Load map ──────────────────────────────────
  useEffect(() => {
    let cancelled = false;

    async function resolveServer(): Promise<string | null> {
      if (serverParam) return serverParam;

      interface ServerSummary { name: string; }
      interface ServerGroup { servers: ServerSummary[]; }
      interface StatusResponse { games: ServerGroup[]; }

      const res = await api.get<StatusResponse>('/server-status');
      if (cancelled || !res.success) return null;

      const names = res.data.games
        .flatMap((g) => g.servers.map((s) => s.name))
        .filter(Boolean);
      return names[0] ?? null;
    }

    async function loadMap(showLoading = false) {
      if (showLoading) {
        setLoading(true);
      }
      setError(null);

      const server = await resolveServer();
      if (cancelled) return;

      if (!server) {
        setError('No server found. Check that the server is running.');
        setLoading(false);
        return;
      }

      const res = await api.get<MapData>(`/maps/${encodeURIComponent(server)}`);
      if (cancelled) return;

      if (res.success) {
        setMapData(res.data);
      } else {
        setError('The map could not be loaded. It may not have been uploaded yet.');
      }

      setLoading(false);
    }

    loadMap(true);
    const interval = window.setInterval(() => {
      void loadMap();
    }, REFRESH_MS);
    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, [serverParam]);

  // ── Zoom toward cursor ────────────────────────
  const handleWheel = useCallback((e: React.WheelEvent<HTMLDivElement>) => {
    e.preventDefault();

    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;

    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    setScale((prevScale) => {
      const delta = -e.deltaY * ZOOM_SENSITIVITY;
      const newScale = Math.min(MAX_SCALE, Math.max(MIN_SCALE, prevScale * (1 + delta)));

      setTranslate((prev) => ({
        x: mouseX - (mouseX - prev.x) * (newScale / prevScale),
        y: mouseY - (mouseY - prev.y) * (newScale / prevScale),
      }));

      return newScale;
    });
  }, []);

  function handlePointerDown(e: React.PointerEvent<HTMLDivElement>) {
    if (e.pointerType === 'mouse' && e.button !== 0) {
      return;
    }

    pointersRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    e.currentTarget.setPointerCapture(e.pointerId);

    if (pointersRef.current.size === 1) {
      dragState.current = { startX: e.clientX, startY: e.clientY, startTx: translate.x, startTy: translate.y };
      pinchState.current = null;
      return;
    }

    if (pointersRef.current.size === 2) {
      const values = Array.from(pointersRef.current.values());
      const dx = values[0].x - values[1].x;
      const dy = values[0].y - values[1].y;
      pinchState.current = {
        distance: Math.hypot(dx, dy),
        scale,
      };
      dragState.current = null;
    }
  }

  function handlePointerMove(e: React.PointerEvent<HTMLDivElement>) {
    if (!pointersRef.current.has(e.pointerId)) {
      return;
    }

    pointersRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY });

    if (pointersRef.current.size === 1 && dragState.current) {
      const dx = e.clientX - dragState.current.startX;
      const dy = e.clientY - dragState.current.startY;
      setTranslate({ x: dragState.current.startTx + dx, y: dragState.current.startTy + dy });
      return;
    }

    if (pointersRef.current.size === 2 && pinchState.current) {
      const values = Array.from(pointersRef.current.values());
      const dx = values[0].x - values[1].x;
      const dy = values[0].y - values[1].y;
      const nextDistance = Math.hypot(dx, dy);

      if (pinchState.current.distance > 0) {
        const ratio = nextDistance / pinchState.current.distance;
        const nextScale = Math.min(MAX_SCALE, Math.max(MIN_SCALE, pinchState.current.scale * ratio));
        setScale(nextScale);
      }
    }
  }

  function handlePointerUpOrCancel(e: React.PointerEvent<HTMLDivElement>) {
    pointersRef.current.delete(e.pointerId);
    if (pointersRef.current.size === 0) {
      dragState.current = null;
      pinchState.current = null;
      return;
    }

    if (pointersRef.current.size === 1) {
      const point = Array.from(pointersRef.current.values())[0];
      dragState.current = {
        startX: point.x,
        startY: point.y,
        startTx: translate.x,
        startTy: translate.y,
      };
      pinchState.current = null;
    }
  }

  function resetView() {
    setScale(1);
    setTranslate({ x: 0, y: 0 });
  }

  function toggleFullscreen() {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen();
    } else {
      document.exitFullscreen();
    }
  }

  const legendItems = mapData?.legend ?? [];

  const legend = legendItems.length > 0 && (
    <ul className={styles.legendList}>
      {legendItems.map((item, i) => (
        <li key={i} className={styles.legendItem}>
          <span className={styles.legendSymbol}>{item.symbol}</span>
          <span className={styles.legendLabel}>{item.label}</span>
        </li>
      ))}
    </ul>
  );

  return (
    <div className={styles.root}>
      <PageHeader
        title="Map"
        subtitle="Explore the world and discover important community locations."
      />

      {loading ? (
        <LoadingState message="Loading map…" />
      ) : error ? (
        <ErrorState message={error} />
      ) : mapData ? (
        <>
          <div className={styles.meta}>
            <MarkdownText className={styles.description} content={mapData.description} />
            <p className={styles.lastUpdated}>
              <span className={styles.lastUpdatedLabel}>Last Updated</span>
              {formatLastUpdated(mapData.last_updated)}
            </p>
          </div>

          <div className={styles.mapSection}>
            {legendItems.length > 0 && (
              <aside className={styles.legend}>
                <h3 className={styles.legendTitle}>Legend</h3>
                {legend}
              </aside>
            )}

            <div
              ref={containerRef}
              className={`${styles.mapContainer} ${isFullscreen ? styles.fullscreen : ''}`}
              onWheel={handleWheel}
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUpOrCancel}
              onPointerCancel={handlePointerUpOrCancel}
            >
              <img
                className={styles.mapImage}
                src={mapData.image_url}
                alt={`Map of ${mapData.server}`}
                draggable={false}
                style={{
                  transform: `translate(${translate.x}px, ${translate.y}px) scale(${scale})`,
                  transformOrigin: '0 0',
                }}
              />

              <div className={styles.controls}>
                <button type="button" className={styles.controlButton} onClick={resetView} title="Reset view" aria-label="Reset view">
                  <ResetIcon />
                  <span>Reset</span>
                </button>
                {isFullscreen && legendItems.length > 0 && (
                  <button
                    type="button"
                    className={`${styles.controlButton} ${showLegendOverlay ? styles.controlButtonActive : ''}`}
                    onClick={() => setShowLegendOverlay((v) => !v)}
                    title="Toggle legend"
                    aria-label="Toggle legend"
                  >
                    <LegendIcon />
                    <span>Legend</span>
                  </button>
                )}
                <button type="button" className={styles.controlButton} onClick={toggleFullscreen} title={isFullscreen ? 'Exit full screen' : 'Full screen'} aria-label={isFullscreen ? 'Exit full screen' : 'Full screen'}>
                  <FullscreenIcon active={isFullscreen} />
                  <span>{isFullscreen ? 'Exit' : 'Full Screen'}</span>
                </button>
              </div>

              {isFullscreen && showLegendOverlay && legendItems.length > 0 && (
                <div className={styles.legendOverlay}>
                  <p className={styles.legendOverlayTitle}>Legend</p>
                  {legend}
                </div>
              )}
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}
