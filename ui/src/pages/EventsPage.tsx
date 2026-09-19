import { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { api } from '@/api/client';
import MarkdownText from '@/components/ui/MarkdownText';
import TrustedExternalLink from '@/components/ui/TrustedExternalLink';
import { Button, Card, LoadingState, PageHeader } from '@/components/ui';
import EventCard, { formatEventSchedule } from '@/components/ui/EventCard';
import type { EventItem } from '@/components/ui/EventCard';
import { usePageTitle } from '@/hooks/usePageTitle';
import styles from './EventsPage.module.css';

interface QuickLinkInput {
  display: string;
  url: string;
}

interface CreateEventForm {
  server: string;
  title: string;
  description: string;
  event_date: string;
  start_time: string;
  end_time: string;
  meetup_location: string;
  expanded_details: string;
  quick_links: QuickLinkInput[];
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

function createEmptyForm(server = ''): CreateEventForm {
  return {
    server,
    title: '',
    description: '',
    event_date: '',
    start_time: '',
    end_time: '',
    meetup_location: '',
    expanded_details: '',
    quick_links: [],
  };
}

function createFormQuickLinks(event: EventItem): QuickLinkInput[] {
  return (event.quick_links ?? []).map((link) => ({
    display: link.display,
    url: link.url,
  }));
}

function normalizeQuickLinkUrl(url: string): string {
  const trimmed = url.trim();
  if (!trimmed) {
    return '';
  }

  if (trimmed.startsWith('/') || /^[a-zA-Z][a-zA-Z\d+.-]*:/.test(trimmed)) {
    return trimmed;
  }

  return `https://${trimmed}`;
}

function toEventQuickLinks(links: QuickLinkInput[]): EventItem['quick_links'] {
  return links
    .map((link) => ({
      display: link.display.trim(),
      url: normalizeQuickLinkUrl(link.url),
    }))
    .filter((link) => link.display.length > 0 && link.url.length > 0);
}

function createFormFromEvent(event: EventItem, fallbackServer = ''): CreateEventForm {
  return {
    server: event.server || fallbackServer,
    title: event.title,
    description: event.description,
    event_date: event.event_date ?? '',
    start_time: event.start_time ? event.start_time.slice(0, 5) : '',
    end_time: event.end_time ? event.end_time.slice(0, 5) : '',
    meetup_location: event.meetup_location ?? '',
    expanded_details: event.expanded_details ?? '',
    quick_links: createFormQuickLinks(event),
  };
}

const FALLBACK_EVENTS: EventItem[] = [
  {
    id: 'evt-sample-1',
    server: 'valheim-main',
    title: 'Friday Boss Fight',
    description: 'Defeat The Queen together. All are welcome!',
    event_date: '2026-08-14',
    start_time: '20:00:00',
    end_time: '22:00:00',
    meetup_location: 'Main Base Portal',
    expanded_details: 'Bring food and potions.\nWe will gather at the portal at 8 PM.',
    image_url: null,
    quick_links: [
      { display: 'Build Plan', url: 'https://example.com/friday-plan' },
    ],
    created_at: '2026-07-29T14:30:00Z',
  },
];

export default function EventsPage() {
  usePageTitle('Events');
  const [searchParams, setSearchParams] = useSearchParams();
  const idParam = searchParams.get('id');
  const serverParam = searchParams.get('server');

  const [events, setEvents] = useState<EventItem[]>(FALLBACK_EVENTS);
  const [loading, setLoading] = useState(true);
  const [availableServers, setAvailableServers] = useState<string[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<EventItem | null>(null);
  const [detailsExpanded, setDetailsExpanded] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [editingEventId, setEditingEventId] = useState<string | null>(null);
  const [form, setForm] = useState<CreateEventForm>(createEmptyForm());
  const [feedback, setFeedback] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const autoOpenAttempted = useRef(false);

  function copyLink(eventId: string) {
    const url = `${window.location.origin}/events?id=${eventId}`;
    navigator.clipboard.writeText(url).then(() => {
      setCopiedId(eventId);
      setTimeout(() => setCopiedId(null), 2000);
    });
  }

  function openDetail(event: EventItem) {
    setSelectedEvent(event);
    setDetailsExpanded(true);
  }

  function openCreateModal() {
    setEditingEventId(null);
    setForm(createEmptyForm(availableServers[0] ?? ''));
    setFeedback(null);
    setShowCreate(true);
  }

  function openEditModal(event: EventItem) {
    setEditingEventId(event.id);
    setForm(createFormFromEvent(event, availableServers[0] ?? ''));
    setFeedback(null);
    setShowCreate(true);
  }

  function closeCreateModal() {
    setShowCreate(false);
    setEditingEventId(null);
    setForm(createEmptyForm(availableServers[0] ?? ''));
  }

  function addQuickLinkField() {
    setForm((current) => ({
      ...current,
      quick_links: [...current.quick_links, { display: '', url: '' }],
    }));
  }

  function updateQuickLinkField(index: number, field: keyof QuickLinkInput, value: string) {
    setForm((current) => ({
      ...current,
      quick_links: current.quick_links.map((link, i) => (i === index ? { ...link, [field]: value } : link)),
    }));
  }

  function removeQuickLinkField(index: number) {
    setForm((current) => ({
      ...current,
      quick_links: current.quick_links.filter((_, i) => i !== index),
    }));
  }

  function closeDetail() {
    setSelectedEvent(null);
    if (idParam) {
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev);
        next.delete('id');
        return next;
      });
    }
  }

  useEffect(() => {
    let cancelled = false;
    autoOpenAttempted.current = false;

    async function loadEvents(showLoading = false) {
      if (showLoading) {
        setLoading(true);
      }

      const query = new URLSearchParams();
      if (serverParam) query.set('server', serverParam);
      const qs = query.size ? `?${query}` : '';

      const response = await api.get<EventItem[] | { events?: EventItem[]; data?: EventItem[] }>(`/events${qs}`);

      if (cancelled) return;

      if (response.success) {
        const payload = response.data;
        const list = Array.isArray(payload)
          ? payload
          : Array.isArray((payload as { events?: EventItem[] }).events)
            ? (payload as { events: EventItem[] }).events
            : Array.isArray((payload as { data?: EventItem[] }).data)
              ? (payload as { data: EventItem[] }).data
              : [];

        setEvents(list.length ? list : FALLBACK_EVENTS);
      } else {
        setEvents(FALLBACK_EVENTS);
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
        setForm((current) => ({
          ...current,
          server: current.server || unique[0],
        }));
      }
    }

    loadEvents(true);
    loadAvailableServers();

    const interval = window.setInterval(() => {
      void loadEvents();
      void loadAvailableServers();
    }, REFRESH_MS);

    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, [serverParam]);

  // Auto-open detail modal when ?id= is present and events have loaded
  useEffect(() => {
    if (!idParam || loading || autoOpenAttempted.current) return;
    autoOpenAttempted.current = true;

    const match = events.find((e) => e.id === idParam);
    if (match) {
      openDetail(match);
    }
  }, [idParam, loading, events]);

  async function handleCreateEvent(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    const title = form.title.trim();
    const description = form.description.trim();
    const quickLinks = toEventQuickLinks(form.quick_links);

    if (!form.server || !title || !description) {
      setFeedback('Please choose a server and fill in the title and description.');
      return;
    }

    const baseEvent = {
      server: form.server,
      title,
      description,
      event_date: form.event_date || null,
      start_time: form.start_time ? `${form.start_time}:00` : null,
      end_time: form.end_time ? `${form.end_time}:00` : null,
      meetup_location: form.meetup_location.trim() || null,
      expanded_details: form.expanded_details.trim() || null,
      image_url: null,
      quick_links: quickLinks,
    };

    const payload = editingEventId
      ? { id: editingEventId, ...baseEvent }
      : { ...baseEvent };

    const response = editingEventId
      ? await api.put<{ data?: Partial<EventItem> } | Partial<EventItem>>(`/events/${editingEventId}`, payload)
      : await api.post<{ data?: Partial<EventItem> } | Partial<EventItem>>('/events', payload);

    if (!response.success) {
      setFeedback(response.error.message);
      return;
    }

    const created = (response.data as { data?: Partial<EventItem> })?.data ?? (response.data as Partial<EventItem>);
    const existingEvent = events.find((event) => event.id === editingEventId);
    const finalEvent: EventItem = editingEventId
      ? {
          ...(existingEvent ?? { id: editingEventId, created_at: new Date().toISOString() }),
          ...baseEvent,
          id: editingEventId,
          ...(created as Partial<EventItem>),
        } as EventItem
      : {
          id: `local-${Date.now()}`,
          created_at: new Date().toISOString(),
          ...baseEvent,
          ...(created as Partial<EventItem>),
        } as EventItem;

    setEvents((current) => editingEventId
      ? current.map((event) => (event.id === editingEventId ? finalEvent : event))
      : [finalEvent, ...current]);
    setForm(createEmptyForm(availableServers[0] ?? ''));
    setFeedback(editingEventId ? 'Your event has been updated.' : 'Your event has been added.');
    setShowCreate(false);
    setEditingEventId(null);
  }

  return (
    <div className={styles.root}>
      <PageHeader
        title="Events"
        subtitle="Plan your next adventure with the community."
      />

      <div className={styles.toolbar}>
        <Button onClick={openCreateModal}>Create Event</Button>
      </div>

      {feedback && <p className={styles.feedback}>{feedback}</p>}

      {loading ? (
        <LoadingState message="Loading events…" />
      ) : events.length === 0 ? (
        <Card className={styles.emptyCard}>
          <h2 className={styles.emptyTitle}>No upcoming events are currently scheduled.</h2>
          <p className={styles.emptyText}>Be the first to organize the next adventure!</p>
          <Button onClick={openCreateModal}>Create an event</Button>
        </Card>
      ) : (
        <div className={styles.list}>
          {events.map((event) => (
            <EventCard
              key={event.id}
              event={event}
              onOpen={() => openDetail(event)}
              onCopyLink={() => copyLink(event.id)}
              onEdit={() => openEditModal(event)}
              copied={copiedId === event.id}
            />
          ))}
        </div>
      )}

      {/* Detail Modal */}
      {selectedEvent && (
        <div className={styles.overlay} role="presentation" onClick={closeDetail}>
          <div className={styles.modal} role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2 className={styles.modalTitle}>{selectedEvent.title}</h2>
              <button
                className={styles.closeButton}
                type="button"
                onClick={closeDetail}
                aria-label="Close event details"
              >
                ×
              </button>
            </div>

            {selectedEvent.image_url && (
              <div className={styles.detailImage}>
                <img src={selectedEvent.image_url} alt={selectedEvent.title} />
              </div>
            )}

            <div className={styles.detailMeta}>
              <span className={styles.serverBadge}>{selectedEvent.server}</span>
              {formatEventSchedule(selectedEvent.event_date, selectedEvent.start_time, selectedEvent.end_time) && (
                <span className={styles.detailSchedule}>
                  {formatEventSchedule(selectedEvent.event_date, selectedEvent.start_time, selectedEvent.end_time)}
                </span>
              )}
              {selectedEvent.meetup_location && (
                <span className={styles.detailLocation}>📍 {selectedEvent.meetup_location}</span>
              )}
            </div>

            <MarkdownText className={styles.detailDescription} content={selectedEvent.description} />

            {(selectedEvent.quick_links ?? []).length > 0 && (
              <div className={styles.quickLinksSection}>
                <h3 className={styles.quickLinksTitle}>Quick Links</h3>
                <div className={styles.quickLinksGrid}>
                  {(selectedEvent.quick_links ?? []).map((link) => (
                    <TrustedExternalLink
                      key={`${selectedEvent.id}-${link.display}-${link.url}`}
                      href={link.url}
                      className={styles.quickLinkCard}
                    >
                      {link.display}
                    </TrustedExternalLink>
                  ))}
                </div>
              </div>
            )}

            {selectedEvent.expanded_details && (
              <div className={styles.expandedSection}>
                <button
                  type="button"
                  className={styles.expandToggle}
                  onClick={() => setDetailsExpanded((v) => !v)}
                  aria-expanded={detailsExpanded}
                >
                  {detailsExpanded ? '▾ Hide details' : '▸ Event details'}
                </button>
                {detailsExpanded && (
                  <MarkdownText className={styles.expandedContent} content={selectedEvent.expanded_details} />
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Create Modal */}
      {showCreate && (
        <div className={styles.overlay} role="presentation" onClick={closeCreateModal}>
          <div className={styles.modal} role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2 className={styles.modalTitle}>{editingEventId ? 'Edit Event' : 'Create Event'}</h2>
              <button
                className={styles.closeButton}
                type="button"
                onClick={closeCreateModal}
                aria-label={editingEventId ? 'Close edit event form' : 'Close create event form'}
              >
                ×
              </button>
            </div>

            <form className={styles.form} onSubmit={handleCreateEvent}>
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
                <span>Title</span>
                <input
                  value={form.title}
                  onChange={(e) => setForm((c) => ({ ...c, title: e.target.value }))}
                  placeholder="Friday Boss Fight"
                />
              </label>

              <label className={styles.field}>
                <span>Description</span>
                <textarea
                  rows={3}
                  value={form.description}
                  onChange={(e) => setForm((c) => ({ ...c, description: e.target.value }))}
                  placeholder="What are we doing?"
                />
              </label>

              <div className={styles.fieldRow}>
                <label className={styles.field}>
                  <span>Date</span>
                  <input
                    type="date"
                    value={form.event_date}
                    onChange={(e) => setForm((c) => ({ ...c, event_date: e.target.value }))}
                  />
                </label>
                <label className={styles.field}>
                  <span>Start Time <span className={styles.optional}>(UTC)</span></span>
                  <input
                    type="time"
                    value={form.start_time}
                    onChange={(e) => setForm((c) => ({ ...c, start_time: e.target.value }))}
                  />
                </label>
                <label className={styles.field}>
                  <span>End Time <span className={styles.optional}>(UTC)</span></span>
                  <input
                    type="time"
                    value={form.end_time}
                    onChange={(e) => setForm((c) => ({ ...c, end_time: e.target.value }))}
                  />
                </label>
              </div>

              <label className={styles.field}>
                <span>Meetup Location <span className={styles.optional}>(optional)</span></span>
                <input
                  value={form.meetup_location}
                  onChange={(e) => setForm((c) => ({ ...c, meetup_location: e.target.value }))}
                  placeholder="Main base portal"
                />
              </label>

              <label className={styles.field}>
                <span>Event Details <span className={styles.optional}>(optional)</span></span>
                <textarea
                  rows={5}
                  value={form.expanded_details}
                  onChange={(e) => setForm((c) => ({ ...c, expanded_details: e.target.value }))}
                  placeholder="What to bring, strategy notes, preparation info…"
                />
              </label>

              <div className={styles.field}>
                <div className={styles.quickLinksHeader}>
                  <span>Quick Links <span className={styles.optional}>(optional)</span></span>
                  <Button type="button" variant="ghost" size="sm" onClick={addQuickLinkField}>Add Link</Button>
                </div>
                {form.quick_links.length === 0 && (
                  <p className={styles.quickLinksHint}>No quick links added. Add display text and a URL to show this section.</p>
                )}
                {form.quick_links.map((link, index) => (
                  <div key={`event-quick-link-${index}`} className={styles.quickLinkRow}>
                    <input
                      value={link.display}
                      onChange={(e) => updateQuickLinkField(index, 'display', e.target.value)}
                      placeholder="Display text"
                    />
                    <input
                      value={link.url}
                      onChange={(e) => updateQuickLinkField(index, 'url', e.target.value)}
                      placeholder="https://example.com"
                    />
                    <Button type="button" variant="ghost" size="sm" onClick={() => removeQuickLinkField(index)}>Remove</Button>
                  </div>
                ))}
              </div>

              <div className={styles.modalActions}>
                <Button type="button" variant="ghost" onClick={closeCreateModal}>Cancel</Button>
                <Button type="submit">{editingEventId ? 'Save changes' : 'Create Event'}</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
