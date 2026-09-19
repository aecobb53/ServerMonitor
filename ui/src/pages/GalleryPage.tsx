import { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { api } from '@/api/client';
import MarkdownText from '@/components/ui/MarkdownText';
import { Button, Card, LoadingState, PageHeader } from '@/components/ui';
import GalleryCard from '@/components/ui/GalleryCard';
import type { GalleryItem } from '@/components/ui/GalleryCard';
import { usePageTitle } from '@/hooks/usePageTitle';
import styles from './GalleryPage.module.css';

interface CreateGalleryForm {
  server: string;
  title: string;
  description: string;
}

interface ServerSummary {
  name: string;
}

interface ServerGroup {
  servers: ServerSummary[];
}

interface ServerStatusResponse {
  games: ServerGroup[];
}

const REFRESH_MS = Number(import.meta.env.VITE_PAGE_REFRESH_MS ?? 15000);

function createEmptyForm(server = ''): CreateGalleryForm {
  return { server, title: '', description: '' };
}

const FALLBACK_ITEMS: GalleryItem[] = [
  {
    id: 'gal-sample-1',
    server: 'valheim-main',
    title: 'Castle Complete',
    description: 'We finally finished the main hall.',
    media_count: 3,
    preview_url: '',
    media_urls: [],
    created_at: '2026-07-28T20:15:00Z',
  },
];

function ChevronIcon({ direction }: { direction: 'left' | 'right' }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {direction === 'left'
        ? <polyline points="15 18 9 12 15 6" />
        : <polyline points="9 18 15 12 9 6" />}
    </svg>
  );
}

function LinkIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
    </svg>
  );
}

export default function GalleryPage() {
  usePageTitle('Gallery');
  const [searchParams, setSearchParams] = useSearchParams();
  const idParam = searchParams.get('id');
  const serverParam = searchParams.get('server');

  const [items, setItems] = useState<GalleryItem[]>(FALLBACK_ITEMS);
  const [loading, setLoading] = useState(true);
  const [availableServers, setAvailableServers] = useState<string[]>([]);
  const [selectedItem, setSelectedItem] = useState<GalleryItem | null>(null);
  const [mediaIndex, setMediaIndex] = useState(0);
  const [showUpload, setShowUpload] = useState(false);
  const [form, setForm] = useState<CreateGalleryForm>(createEmptyForm());
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [copiedImageUrl, setCopiedImageUrl] = useState<string | null>(null);
  const autoOpenAttempted = useRef(false);

  function copyLink(itemId: string) {
    const url = `${window.location.origin}/gallery?id=${itemId}`;
    navigator.clipboard.writeText(url).then(() => {
      setCopiedId(itemId);
      setTimeout(() => setCopiedId(null), 2000);
    });
  }

  function copyImageLink(imageUrl: string) {
    navigator.clipboard.writeText(imageUrl).then(() => {
      setCopiedImageUrl(imageUrl);
      setTimeout(() => setCopiedImageUrl(null), 2000);
    });
  }

  function openDetail(item: GalleryItem) {
    setSelectedItem(item);
    setMediaIndex(0);
  }

  function openUploadModal() {
    setSelectedFiles([]);
    setFeedback(null);
    setShowUpload(true);
  }

  function closeUploadModal() {
    setShowUpload(false);
    setSelectedFiles([]);
  }

  function closeDetail() {
    setSelectedItem(null);
    if (idParam) {
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev);
        next.delete('id');
        return next;
      });
    }
  }

  function prevMedia() {
    if (!selectedItem) return;
    setMediaIndex((i) => (i - 1 + selectedItem.media_urls.length) % selectedItem.media_urls.length);
  }

  function nextMedia() {
    if (!selectedItem) return;
    setMediaIndex((i) => (i + 1) % selectedItem.media_urls.length);
  }

  useEffect(() => {
    let cancelled = false;
    autoOpenAttempted.current = false;

    async function loadGallery(showLoading = false) {
      if (showLoading) {
        setLoading(true);
      }

      const query = new URLSearchParams();
      if (serverParam) query.set('server', serverParam);
      const qs = query.size ? `?${query}` : '';

      const response = await api.get<GalleryItem[] | { items?: GalleryItem[]; data?: GalleryItem[] }>(`/gallery${qs}`);

      if (cancelled) return;

      if (response.success) {
        const payload = response.data;
        const list = Array.isArray(payload)
          ? payload
          : Array.isArray((payload as { items?: GalleryItem[] }).items)
            ? (payload as { items: GalleryItem[] }).items
            : Array.isArray((payload as { data?: GalleryItem[] }).data)
              ? (payload as { data: GalleryItem[] }).data
              : [];

        setItems(list.length ? list : FALLBACK_ITEMS);
      } else {
        setItems(FALLBACK_ITEMS);
      }

      setLoading(false);
    }

    async function loadAvailableServers() {
      const response = await api.get<ServerStatusResponse>('/server-status');
      if (cancelled || !response.success) return;

      const names = response.data.games
        .flatMap((g) => g.servers.map((s) => s.name))
        .filter((n): n is string => Boolean(n));
      const unique = Array.from(new Set(names));

      setAvailableServers(unique);
      if (unique.length > 0) {
        setForm((current) => ({ ...current, server: current.server || unique[0] }));
      }
    }

    loadGallery(true);
    loadAvailableServers();

    const interval = window.setInterval(() => {
      void loadGallery();
      void loadAvailableServers();
    }, REFRESH_MS);

    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, [serverParam]);

  // Auto-open detail modal when ?id= is present and items have loaded
  useEffect(() => {
    if (!idParam || loading || autoOpenAttempted.current) return;
    autoOpenAttempted.current = true;

    const match = items.find((item) => item.id === idParam);
    if (match) openDetail(match);
  }, [idParam, loading, items]);

  async function handleUpload(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (!form.server) {
      setFeedback('Please choose a server.');
      return;
    }

    if (selectedFiles.length === 0) {
      setFeedback('Please select at least one image to upload.');
      return;
    }

    const payload = new FormData();
    payload.append('server', form.server);
    if (form.title.trim()) payload.append('title', form.title.trim());
    if (form.description.trim()) payload.append('description', form.description.trim());
    selectedFiles.forEach((file) => payload.append('files', file));

    const response = await api.postForm<{ file_count?: number }>('/gallery/upload', payload);

    if (!response.success) {
      setFeedback(response.error.message);
      return;
    }

    const uploadedCount = response.data.file_count ?? selectedFiles.length;
    setFeedback(`Upload request sent for ${uploadedCount} image${uploadedCount === 1 ? '' : 's'}.`);
    setForm(createEmptyForm(availableServers[0] ?? ''));
    setSelectedFiles([]);
    setShowUpload(false);
    return;
  }

  const currentMediaUrl = selectedItem?.media_urls[mediaIndex] ?? selectedItem?.preview_url ?? '';
  const hasMultipleMedia = (selectedItem?.media_urls.length ?? 0) > 1;

  return (
    <div className={styles.root}>
      <PageHeader
        title="Gallery"
        subtitle="Relive the adventures, victories, and memorable moments shared by the community."
      />

      <div className={styles.toolbar}>
        <Button onClick={openUploadModal}>Upload Media</Button>
      </div>

      {feedback && <p className={styles.feedback}>{feedback}</p>}

      {loading ? (
        <LoadingState message="Loading gallery…" />
      ) : items.length === 0 ? (
        <Card className={styles.emptyCard}>
          <h2 className={styles.emptyTitle}>No screenshots have been shared yet.</h2>
          <p className={styles.emptyText}>Go create something worth remembering!</p>
          <Button onClick={openUploadModal}>Upload the first screenshot</Button>
        </Card>
      ) : (
        <div className={styles.grid}>
          {items.map((item) => (
            <GalleryCard
              key={item.id}
              item={item}
              onOpen={() => openDetail(item)}
              onCopyLink={() => copyLink(item.id)}
              copied={copiedId === item.id}
            />
          ))}
        </div>
      )}

      {/* Detail Modal */}
      {selectedItem && (
        <div className={styles.overlay} role="presentation" onClick={closeDetail}>
          <div className={styles.detailModal} role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2 className={styles.modalTitle}>{selectedItem.title ?? 'Gallery'}</h2>
              <button className={styles.closeButton} type="button" onClick={closeDetail} aria-label="Close gallery viewer">×</button>
            </div>

            {currentMediaUrl ? (
              <div className={styles.mediaViewer}>
                <img
                  className={styles.mediaImage}
                  src={currentMediaUrl}
                  alt={selectedItem.title ?? `Image ${mediaIndex + 1}`}
                />
                {hasMultipleMedia && (
                  <>
                    <button
                      type="button"
                      className={`${styles.navButton} ${styles.navLeft}`}
                      onClick={prevMedia}
                      aria-label="Previous image"
                    >
                      <ChevronIcon direction="left" />
                    </button>
                    <button
                      type="button"
                      className={`${styles.navButton} ${styles.navRight}`}
                      onClick={nextMedia}
                      aria-label="Next image"
                    >
                      <ChevronIcon direction="right" />
                    </button>
                    <span className={styles.mediaCounter}>
                      {mediaIndex + 1} / {selectedItem.media_urls.length}
                    </span>
                  </>
                )}
              </div>
            ) : (
              <div className={styles.noMedia}>No images available.</div>
            )}

            <div className={styles.detailMeta}>
              <span className={styles.serverBadge}>{selectedItem.server}</span>
              {selectedItem.media_count > 1 && (
                <span className={styles.mediaCountLabel}>{selectedItem.media_count} images</span>
              )}
              {currentMediaUrl && (
                <button
                  type="button"
                  className={styles.copyImageButton}
                  onClick={() => copyImageLink(currentMediaUrl)}
                  aria-label="Copy direct image link"
                  title={copiedImageUrl === currentMediaUrl ? 'Copied!' : 'Copy image link'}
                >
                  <LinkIcon />
                </button>
              )}
            </div>

            {selectedItem.description && (
              <MarkdownText className={styles.detailDescription} content={selectedItem.description} />
            )}
          </div>
        </div>
      )}

      {/* Upload Modal */}
      {showUpload && (
        <div className={styles.overlay} role="presentation" onClick={closeUploadModal}>
          <div className={styles.modal} role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2 className={styles.modalTitle}>Upload Media</h2>
              <button className={styles.closeButton} type="button" onClick={closeUploadModal} aria-label="Close upload form">×</button>
            </div>

            <form className={styles.form} onSubmit={handleUpload}>
              <label className={styles.field}>
                <span>Server</span>
                <select
                  value={form.server}
                  onChange={(e) => setForm((c) => ({ ...c, server: e.target.value }))}
                  disabled={availableServers.length === 0}
                >
                  {availableServers.length === 0 ? (
                    <option value="">No servers available</option>
                  ) : (
                    availableServers.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))
                  )}
                </select>
              </label>

              <label className={styles.field}>
                <span>Title <span className={styles.optional}>(optional)</span></span>
                <input
                  value={form.title}
                  onChange={(e) => setForm((c) => ({ ...c, title: e.target.value }))}
                  placeholder="Castle Complete"
                />
              </label>

              <label className={styles.field}>
                <span>Description <span className={styles.optional}>(optional)</span></span>
                <textarea
                  rows={3}
                  value={form.description}
                  onChange={(e) => setForm((c) => ({ ...c, description: e.target.value }))}
                  placeholder="What's in these screenshots?"
                />
              </label>

              <label className={styles.field}>
                <span>Images</span>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={(e) => setSelectedFiles(Array.from(e.target.files ?? []))}
                />
              </label>

              {selectedFiles.length > 0 ? (
                <ul className={styles.fileList}>
                  {selectedFiles.map((file, index) => (
                    <li key={`${file.name}-${index}`} className={styles.fileItem}>
                      <span>{file.name}</span>
                      <span className={styles.fileSize}>{Math.max(1, Math.round(file.size / 1024))} KB</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className={styles.uploadNote}>Select one or more images to send to the upload endpoint.</p>
              )}

              <div className={styles.modalActions}>
                <Button type="button" variant="ghost" onClick={closeUploadModal}>Cancel</Button>
                <Button type="submit">Upload Selected Images</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
