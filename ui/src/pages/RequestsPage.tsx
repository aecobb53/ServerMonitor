import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { api } from '@/api/client';
import MarkdownText from '@/components/ui/MarkdownText';
import TrustedExternalLink from '@/components/ui/TrustedExternalLink';
import { Button, Card, LoadingState, PageHeader } from '@/components/ui';
import { usePageTitle } from '@/hooks/usePageTitle';
import styles from './RequestsPage.module.css';

interface RequestItem {
  id: string;
  server: string;
  title: string;
  requested_by: string;
  urgency: 'Whenever' | 'Soon' | 'Urgent';
  description: string;
  quick_links?: RequestQuickLink[];
  created_at: string;
  completed?: boolean;
  archived?: boolean;
}

interface RequestQuickLink {
  display: string;
  url: string;
}

interface QuickLinkInput {
  display: string;
  url: string;
}

interface CreateRequestForm {
  server: string;
  title: string;
  requested_by: string;
  urgency: RequestItem['urgency'];
  description: string;
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

type ApiUrgency = 'URGENT' | 'SOON' | 'WHENEVER';

function createEmptyForm(server = ''): CreateRequestForm {
  return {
    server,
    title: '',
    requested_by: '',
    urgency: 'Whenever',
    description: '',
    quick_links: [],
  };
}

function createFormQuickLinks(request: RequestItem): QuickLinkInput[] {
  return (request.quick_links ?? []).map((link) => ({
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

function toRequestQuickLinks(links: QuickLinkInput[]): RequestQuickLink[] {
  return links
    .map((link) => ({
      display: link.display.trim(),
      url: normalizeQuickLinkUrl(link.url),
    }))
    .filter((link) => link.display.length > 0 && link.url.length > 0);
}

function createFormFromRequest(request: RequestItem, fallbackServer = ''): CreateRequestForm {
  return {
    server: request.server || fallbackServer,
    title: request.title,
    requested_by: request.requested_by,
    urgency: request.urgency,
    description: request.description,
    quick_links: createFormQuickLinks(request),
  };
}

const FALLBACK_REQUESTS: RequestItem[] = [
  {
    id: 'sample-1',
    server: 'valheim-main',
    title: 'Weekend raid night',
    requested_by: 'Alex',
    urgency: 'Soon',
    description: 'We should host a shared raid night this weekend and rotate who leads the event.',
    quick_links: [
      { display: 'Sign Up Board', url: 'https://example.com/raid-night' },
    ],
    created_at: '2026-07-27T18:00:00Z',
    completed: false,
  },
  {
    id: 'sample-2',
    server: 'valheim-main',
    title: 'More server upkeep',
    requested_by: 'Maya',
    urgency: 'Whenever',
    description: 'A few quality-of-life upgrades would make the server feel more welcoming for new players.',
    quick_links: [],
    created_at: '2026-07-27T17:30:00Z',
    completed: true,
  },
];

function toApiUrgency(urgency: string): ApiUrgency {
  switch (urgency.toUpperCase()) {
    case 'URGENT':
      return 'URGENT';
    case 'SOON':
      return 'SOON';
    default:
      return 'WHENEVER';
  }
}

function toUiUrgency(urgency: unknown): RequestItem['urgency'] {
  if (typeof urgency !== 'string') {
    return 'Whenever';
  }

  switch (urgency.toUpperCase()) {
    case 'URGENT':
      return 'Urgent';
    case 'SOON':
      return 'Soon';
    default:
      return 'Whenever';
  }
}

function normalizeRequest(raw: Partial<RequestItem> & { urgency?: unknown }, fallback: RequestItem): RequestItem {
  return {
    ...fallback,
    ...raw,
    id: String(raw.id ?? fallback.id),
    server: String(raw.server ?? fallback.server),
    title: String(raw.title ?? fallback.title),
    requested_by: String(raw.requested_by ?? fallback.requested_by),
    description: String(raw.description ?? fallback.description),
    created_at: String(raw.created_at ?? fallback.created_at),
    urgency: toUiUrgency(raw.urgency ?? fallback.urgency),
    quick_links: Array.isArray(raw.quick_links)
      ? raw.quick_links
          .map((link) => ({
            display: typeof link?.display === 'string' ? link.display : '',
            url: typeof link?.url === 'string' ? link.url : '',
          }))
          .filter((link) => link.display.length > 0 && link.url.length > 0)
      : fallback.quick_links,
    completed: raw.completed ?? fallback.completed,
    archived: raw.archived ?? fallback.archived,
  };
}

function LinkIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
    </svg>
  );
}

export default function RequestsPage() {
  usePageTitle('Requests');
  const [searchParams, setSearchParams] = useSearchParams();
  const idFilter = searchParams.get('id');
  const [requests, setRequests] = useState<RequestItem[]>(FALLBACK_REQUESTS);
  const [availableServers, setAvailableServers] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingRequestId, setEditingRequestId] = useState<string | null>(null);
  const [form, setForm] = useState<CreateRequestForm>(createEmptyForm());
  const [feedback, setFeedback] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  function copyLink(requestId: string) {
    const url = `${window.location.origin}/requests?id=${requestId}`;
    navigator.clipboard.writeText(url).then(() => {
      setCopiedId(requestId);
      setTimeout(() => setCopiedId(null), 2000);
    });
  }

  function resetCreateModal() {
    setShowCreateModal(false);
    setEditingRequestId(null);
    setForm(createEmptyForm(availableServers[0] ?? ''));
  }

  function openCreateModal() {
    const defaultServer = availableServers[0] ?? '';
    setEditingRequestId(null);
    setForm(createEmptyForm(defaultServer));
    setShowCreateModal(true);
  }

  function openEditModal(request: RequestItem) {
    setEditingRequestId(request.id);
    setForm(createFormFromRequest(request, availableServers[0] ?? ''));
    setShowCreateModal(true);
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

  useEffect(() => {
    let cancelled = false;

    async function loadRequests(showLoading = false) {
      if (showLoading) {
        setLoading(true);
      }

      const response = await api.get<RequestItem[] | { requests?: RequestItem[]; items?: RequestItem[]; data?: RequestItem[] }>('/requests');

      if (cancelled) {
        return;
      }

      if (response.success) {
        const payload = response.data;
        const list = Array.isArray(payload)
          ? payload
          : Array.isArray(payload?.requests)
            ? payload.requests
            : Array.isArray(payload?.items)
              ? payload.items
              : Array.isArray(payload?.data)
                ? payload.data
                : [];

        setRequests(list.length ? list : FALLBACK_REQUESTS);
      } else {
        setRequests(FALLBACK_REQUESTS);
      }

      setLoading(false);
    }

    async function loadAvailableServers() {
      const response = await api.get<ServerStatusResponse>('/server-status');

      if (cancelled || !response.success) {
        return;
      }

      const names = response.data.games
        .flatMap((group) => group.servers.map((server) => server.name))
        .filter((name): name is string => Boolean(name));
      const uniqueNames = Array.from(new Set(names));

        setAvailableServers(uniqueNames);
        if (uniqueNames.length > 0) {
          setForm((current) => ({
            ...current,
            server: uniqueNames.includes(current.server) ? current.server : uniqueNames[0],
          }));
        }
    }

    loadRequests(true);
    loadAvailableServers();

    const interval = window.setInterval(() => {
      void loadRequests();
      void loadAvailableServers();
    }, REFRESH_MS);

    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, []);

  async function handleCreateRequest(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const title = form.title.trim();
    const requestedBy = form.requested_by.trim();
    const description = form.description.trim();
    const quickLinks = toRequestQuickLinks(form.quick_links);

    if (!form.server || !title || !requestedBy || !description) {
      setFeedback('Please choose a server and fill in the title, requested by, and description fields.');
      return;
    }

    const existingRequest = editingRequestId ? requests.find((item) => item.id === editingRequestId) : null;
    const nextRequest: RequestItem = {
      id: editingRequestId ?? `local-${Date.now()}`,
      server: form.server,
      title,
      requested_by: requestedBy,
      urgency: form.urgency,
      description,
      quick_links: quickLinks,
      created_at: existingRequest?.created_at ?? new Date().toISOString(),
      completed: existingRequest?.completed ?? false,
      archived: existingRequest?.archived ?? false,
    };

    const response = editingRequestId
      ? await api.put<{ data?: Partial<RequestItem> & { urgency?: unknown } } | (Partial<RequestItem> & { urgency?: unknown })>(`/requests/${editingRequestId}`, {
          ...nextRequest,
          urgency: toApiUrgency(nextRequest.urgency),
          image: null,
        })
      : await api.post<{ data?: Partial<RequestItem> & { urgency?: unknown } } | (Partial<RequestItem> & { urgency?: unknown })>('/requests', {
          ...nextRequest,
          urgency: toApiUrgency(nextRequest.urgency),
          image: null,
        });

    if (!response.success) {
      setFeedback(response.error.message);
      return;
    }

    const createdFromApi = (response.data as { data?: Partial<RequestItem> & { urgency?: unknown } })?.data ?? (response.data as Partial<RequestItem> & { urgency?: unknown });
    const createdRequest = createdFromApi ? normalizeRequest(createdFromApi, nextRequest) : nextRequest;

    setRequests((current) => editingRequestId
      ? current.map((item) => (item.id === editingRequestId ? createdRequest : item))
      : [createdRequest, ...current]);
    setForm(createEmptyForm(availableServers[0] ?? ''));
    setFeedback(editingRequestId ? 'Your request has been updated.' : 'Your request has been added to the board.');
    setShowCreateModal(false);
    setEditingRequestId(null);
  }

  async function toggleCompletion(request: RequestItem) {
    const nextCompleted = !request.completed;

    const response = await api.put<{ data?: Partial<RequestItem> & { urgency?: unknown } } | (Partial<RequestItem> & { urgency?: unknown })>(`/requests/${request.id}`, {
      ...request,
      urgency: toApiUrgency(request.urgency),
      completed: nextCompleted,
      archived: request.archived ?? false,
      image: null,
    });

    if (response.success) {
      const updatedFromApi = (response.data as { data?: Partial<RequestItem> & { urgency?: unknown } })?.data ?? (response.data as Partial<RequestItem> & { urgency?: unknown });
      const updatedRequest = updatedFromApi
        ? normalizeRequest(updatedFromApi, { ...request, completed: nextCompleted })
        : { ...request, completed: nextCompleted };

      setRequests((current) => current.map((item) => (item.id === request.id ? updatedRequest : item)));
      setFeedback(nextCompleted ? 'Request marked as complete.' : 'Request marked as incomplete.');
    } else {
      setFeedback(response.error.message);
    }
  }

  const visibleRequests = idFilter ? requests.filter((r) => r.id === idFilter) : requests;

  return (
    <div className={styles.root}>
      <PageHeader
        title="Requests"
        subtitle="Help the community by completing requests from other players."
      />

      <div className={styles.notice}>
        <strong>Privacy Reminder:</strong> This website is publicly accessible. Please do not include real names, addresses, passwords, or other sensitive personal information in your requests.
      </div>

      {idFilter && (
        <div className={styles.filterBanner}>
          Showing a single request.{' '}
          <button className={styles.clearFilter} type="button" onClick={() => setSearchParams({})}>
            Show all requests
          </button>
        </div>
      )}

      <div className={styles.toolbar}>
        {!idFilter && <Button onClick={openCreateModal}>Create Request</Button>}
      </div>

      {feedback && <p className={styles.feedback}>{feedback}</p>}

      {loading ? (
        <LoadingState message="Loading requests…" />
      ) : visibleRequests.length === 0 ? (
        <Card className={styles.emptyCard}>
          {idFilter ? (
            <>
              <h2 className={styles.emptyTitle}>Request not found.</h2>
              <p className={styles.emptyText}>This request may have been removed or the link is invalid.</p>
              <Button onClick={() => setSearchParams({})}>View all requests</Button>
            </>
          ) : (
            <>
              <h2 className={styles.emptyTitle}>Nothing has been requested yet.</h2>
              <p className={styles.emptyText}>Be the first to ask the community for help.</p>
              <Button onClick={openCreateModal}>Create the first request</Button>
            </>
          )}
        </Card>
      ) : (
        <div className={styles.list}>
          {visibleRequests.map((request) => (
            <Card key={request.id} className={styles.card}>
              <div className={styles.cardHeader}>
                <div>
                  <h2 className={styles.title}>{request.title}</h2>
                  <p className={styles.meta}>Requested by {request.requested_by}</p>
                </div>
                <div className={styles.badges}>
                  <span className={styles.serverBadge}>{request.server}</span>
                  <span className={styles.urgencyBadge}>{request.urgency}</span>
                </div>
              </div>
              <MarkdownText className={styles.description} content={request.description} />
              {(request.quick_links ?? []).length > 0 && (
                <div className={styles.quickLinksSection}>
                  <p className={styles.quickLinksTitle}>Quick Links</p>
                  <div className={styles.quickLinksGrid}>
                    {(request.quick_links ?? []).map((link) => (
                      <TrustedExternalLink
                        key={`${request.id}-${link.display}-${link.url}`}
                        href={link.url}
                        className={styles.quickLinkCard}
                      >
                        {link.display}
                      </TrustedExternalLink>
                    ))}
                  </div>
                </div>
              )}
              <div className={styles.footer}>
                <p className={styles.timestamp}>{request.created_at}</p>
                <div className={styles.footerActions}>
                  <button
                    type="button"
                    className={styles.copyButton}
                    onClick={(event) => {
                      event.stopPropagation();
                      openEditModal(request);
                    }}
                    aria-label="Edit this request"
                    title="Edit request"
                  >
                    ✎
                  </button>
                  <button
                    type="button"
                    className={styles.copyButton}
                    onClick={(event) => {
                      event.stopPropagation();
                      copyLink(request.id);
                    }}
                    aria-label="Copy link to this request"
                    title={copiedId === request.id ? 'Copied!' : 'Copy link'}
                  >
                    <LinkIcon />
                    {copiedId === request.id && <span className={styles.copiedLabel}>Copied!</span>}
                  </button>
                  <Button
                    type="button"
                    variant={request.completed ? 'secondary' : 'primary'}
                    size="sm"
                    onClick={() => toggleCompletion(request)}
                  >
                    {request.completed ? 'Mark Incomplete' : 'Mark Complete'}
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {showCreateModal && (
        <div className={styles.overlay} role="presentation" onClick={resetCreateModal}>
          <div className={styles.modal} role="dialog" aria-modal="true" onClick={(event) => event.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2 className={styles.modalTitle}>{editingRequestId ? 'Edit Request' : 'Create Request'}</h2>
              <button className={styles.closeButton} type="button" onClick={resetCreateModal} aria-label={editingRequestId ? 'Close edit request form' : 'Close request form'}>
                ×
              </button>
            </div>

            <form className={styles.form} onSubmit={handleCreateRequest}>
              <label className={styles.field}>
                <span>Server</span>
                <select
                  value={form.server}
                  onChange={(event) => setForm((current) => ({ ...current, server: event.target.value }))}
                  disabled={availableServers.length === 0}
                >
                  {availableServers.length === 0 ? (
                    <option value="">No servers available</option>
                  ) : (
                    availableServers.map((serverName) => (
                      <option key={serverName} value={serverName}>{serverName}</option>
                    ))
                  )}
                </select>
              </label>

              <label className={styles.field}>
                <span>Title</span>
                <input
                  value={form.title}
                  onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))}
                  placeholder="Need help with a build project"
                />
              </label>

              <label className={styles.field}>
                <span>Requested By</span>
                <input
                  value={form.requested_by}
                  onChange={(event) => setForm((current) => ({ ...current, requested_by: event.target.value }))}
                  placeholder="Your name or handle"
                />
              </label>

              <label className={styles.field}>
                <span>Urgency</span>
                <select
                  value={form.urgency}
                  onChange={(event) => setForm((current) => ({ ...current, urgency: event.target.value as RequestItem['urgency'] }))}
                >
                  <option value="Whenever">Whenever</option>
                  <option value="Soon">Soon</option>
                  <option value="Urgent">Urgent</option>
                </select>
              </label>

              <label className={styles.field}>
                <span>Description</span>
                <textarea
                  rows={6}
                  value={form.description}
                  onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))}
                  placeholder="Describe what you need help with."
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
                  <div key={`request-quick-link-${index}`} className={styles.quickLinkRow}>
                    <input
                      value={link.display}
                      onChange={(event) => updateQuickLinkField(index, 'display', event.target.value)}
                      placeholder="Display text"
                    />
                    <input
                      value={link.url}
                      onChange={(event) => updateQuickLinkField(index, 'url', event.target.value)}
                      placeholder="https://example.com"
                    />
                    <Button type="button" variant="ghost" size="sm" onClick={() => removeQuickLinkField(index)}>Remove</Button>
                  </div>
                ))}
              </div>

              <div className={styles.modalActions}>
                <Button type="button" variant="ghost" onClick={resetCreateModal}>Cancel</Button>
                <Button type="submit">{editingRequestId ? 'Save Changes' : 'Create Request'}</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}