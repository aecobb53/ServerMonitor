import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useBlocker, useParams } from 'react-router-dom';
import { api, type ApiResponse } from '@/api/client';
import { Button, ErrorState, LoadingState, PageHeader } from '@/components/ui';
import MarkdownText from '@/components/ui/MarkdownText';
import { usePageTitle } from '@/hooks/usePageTitle';
import styles from './ReporterAdminPage.module.css';

type ServerInfo = {
  server_name: string;
  game: string;
  display_name: string;
  description: string;
  news: string[];
  rules: string[];
};

type ComponentStatus = {
  status: string | null;
  cpu_usage?: number | null;
  disk_usage?: string | null;
  errors: string[] | null;
};

type AdminPageData = {
  offline: boolean;
  info: ServerInfo;
  status: {
    container: ComponentStatus;
    server: ComponentStatus;
  } | null;
  logs: string[] | null;
  errors: string[] | null;
};

type FormState = {
  description: string;
  news: string[];
  rules: string[];
};

const UNAUTHORIZED_CODES = ['HTTP_401', 'INVALID_ADMIN_PASSWORD'];

function authHeaders(password: string) {
  return { 'X-Admin-Password': password };
}

function toForm(info: ServerInfo): FormState {
  return {
    description: info.description ?? '',
    news: [...(info.news ?? [])],
    rules: [...(info.rules ?? [])],
  };
}

function errorMessage(response: ApiResponse<unknown>): string {
  return response.success ? 'Something went wrong.' : response.error.message;
}

function ListEditor({
  label,
  items,
  disabled,
  onChange,
}: {
  label: string;
  items: string[];
  disabled: boolean;
  onChange: (items: string[]) => void;
}) {
  return (
    <div className={styles.listEditor}>
      <h3 className={styles.fieldTitle}>{label}</h3>
      {items.length === 0 && <p className={styles.muted}>No entries.</p>}
      {items.map((item, index) => (
        <div key={index} className={styles.listRow}>
          <textarea
            className={styles.textarea}
            rows={2}
            value={item}
            disabled={disabled}
            aria-label={`${label} entry ${index + 1}`}
            onChange={(event) => onChange(items.map((entry, i) => (i === index ? event.target.value : entry)))}
          />
          <Button
            type="button"
            variant="danger"
            size="sm"
            disabled={disabled}
            aria-label={`Delete ${label} entry ${index + 1}`}
            onClick={() => onChange(items.filter((_, i) => i !== index))}
          >
            Delete
          </Button>
        </div>
      ))}
      <div>
        <Button type="button" variant="secondary" size="sm" disabled={disabled} onClick={() => onChange([...items, ''])}>
          Add {label.toLowerCase()} entry
        </Button>
      </div>
    </div>
  );
}

function EntryList({ title, entries, emptyText }: { title: string; entries: string[] | null; emptyText: string }) {
  return (
    <details className={styles.collapsible}>
      <summary className={styles.collapsibleSummary}>{title}</summary>
      <div className={styles.entryList}>
        {!entries || entries.length === 0 ? (
          <p className={styles.muted}>{emptyText}</p>
        ) : (
          entries.map((entry, index) => (
            <pre key={index} className={styles.entry}>{entry}</pre>
          ))
        )}
      </div>
    </details>
  );
}

function StatusLine({ label, value }: { label: string; value: string | number | null | undefined }) {
  return (
    <div className={styles.metric}>
      <span className={styles.metricLabel}>{label}</span>
      <strong className={styles.metricValue}>{value === null || value === undefined || value === '' ? 'Unavailable' : value}</strong>
    </div>
  );
}

function ErrorLines({ label, errors }: { label: string; errors: string[] | null | undefined }) {
  return (
    <div className={styles.metric}>
      <span className={styles.metricLabel}>{label}</span>
      {errors == null ? (
        <strong className={styles.metricValue}>Unavailable</strong>
      ) : errors.length === 0 ? (
        <strong className={styles.metricValue}>None</strong>
      ) : (
        <ul className={styles.errorList}>
          {errors.map((message, index) => <li key={index}>{message}</li>)}
        </ul>
      )}
    </div>
  );
}

export default function ReporterAdminPage() {
  const { name } = useParams<{ name: string }>();
  const slug = name ?? '';
  usePageTitle(`Admin: ${slug}`);

  const [password, setPassword] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [notFound, setNotFound] = useState(false);
  const [data, setData] = useState<AdminPageData | null>(null);
  const [form, setForm] = useState<FormState | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [loginLoading, setLoginLoading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const base = `/control-core/admin/servers/${encodeURIComponent(slug)}`;

  const dirty = useMemo(() => {
    if (!data || !form) {
      return false;
    }
    return JSON.stringify(form) !== JSON.stringify(toForm(data.info));
  }, [data, form]);

  const blocker = useBlocker(dirty);

  useEffect(() => {
    if (blocker.state !== 'blocked') {
      return;
    }
    if (window.confirm('You have unsaved changes. Leave this page and discard them?')) {
      blocker.proceed();
    } else {
      blocker.reset();
    }
  }, [blocker]);

  useEffect(() => {
    if (!dirty) {
      return undefined;
    }
    const handler = (event: BeforeUnloadEvent) => {
      event.preventDefault();
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [dirty]);

  const clearProtectedState = useCallback(() => {
    setPassword('');
    setIsAuthenticated(false);
    setData(null);
    setForm(null);
    setShowPreview(false);
    setNotice(null);
  }, []);

  useEffect(() => () => clearProtectedState(), [clearProtectedState]);

  // Slug changed: drop everything from the previous server.
  useEffect(() => {
    clearProtectedState();
    setNotFound(false);
    setError(null);
  }, [slug, clearProtectedState]);

  const handleFailure = useCallback((response: ApiResponse<unknown>) => {
    if (response.success) {
      return;
    }
    if (UNAUTHORIZED_CODES.includes(response.error.code)) {
      clearProtectedState();
      setError('Authentication failed. Please sign in again.');
      return;
    }
    if (response.error.code === 'SERVER_NOT_FOUND' || response.error.code === 'HTTP_404') {
      clearProtectedState();
      setNotFound(true);
      return;
    }
    setError(response.error.message);
  }, [clearProtectedState]);

  const loadData = useCallback(async (adminPassword: string) => {
    setLoading(true);
    setError(null);
    const response = await api.get<AdminPageData>(base, { headers: authHeaders(adminPassword) });
    setLoading(false);

    if (!response.success) {
      handleFailure(response);
      return false;
    }
    setData(response.data);
    setForm(toForm(response.data.info));
    return true;
  }, [base, handleFailure]);

  async function handleLogin(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setLoginLoading(true);

    const response = await api.post<null>('/control-core/admin/login', {
      password,
      server_slug: slug,
    });

    if (!response.success) {
      setLoginLoading(false);
      if (response.error.code === 'SERVER_NOT_FOUND' || response.error.code === 'HTTP_404') {
        setNotFound(true);
        return;
      }
      setError(errorMessage(response));
      return;
    }

    setIsAuthenticated(true);
    setLoginLoading(false);
    await loadData(password);
  }

  async function handleRefresh() {
    if (dirty && !window.confirm('Refreshing will discard your unsaved changes. Continue?')) {
      return;
    }
    setNotice(null);
    await loadData(password);
  }

  async function handleSave() {
    if (!form) {
      return;
    }
    setSaving(true);
    setError(null);
    setNotice(null);

    const response = await api.patch<AdminPageData>(base, form, { headers: authHeaders(password) });
    setSaving(false);

    if (!response.success) {
      // Unsaved form values are kept so the user can retry.
      handleFailure(response);
      return;
    }
    setData(response.data);
    setForm(toForm(response.data.info));
    setNotice('Changes saved.');
  }

  async function handleAction(action: 'start' | 'restart') {
    const text = action === 'start'
      ? 'Start this server?'
      : 'Restart this server?\n\nA normal restart is quick, but in rare cases it can take up to 20 minutes.';
    if (!window.confirm(text)) {
      return;
    }
    setError(null);
    setNotice(null);

    const response = await api.post<{ server: string; action: string }>(`${base}/${action}`, {}, {
      headers: authHeaders(password),
    });

    if (!response.success) {
      handleFailure(response);
      return;
    }
    setNotice(`${action === 'start' ? 'Start' : 'Restart'} requested. Use Refresh to check the latest status.`);
  }

  if (notFound) {
    return (
      <div className={styles.notFound}>
        <h1 className={styles.notFoundCode}>404</h1>
        <p className={styles.muted}>That server doesn't exist.</p>
        <Link to="/servers" className={styles.linkButton}>Back to servers</Link>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className={styles.root}>
        <PageHeader
          title="Server Admin"
          subtitle="Restricted area. Sign in to manage this server."
          actions={<Link to={`/servers/${encodeURIComponent(slug)}`} className={styles.linkButton}>Back to server</Link>}
        />
        <div className={styles.loginCard}>
          <form className={styles.loginForm} onSubmit={handleLogin}>
            <label className={styles.fieldTitle} htmlFor="reporter-admin-password">Admin password</label>
            <input
              id="reporter-admin-password"
              type="password"
              className={styles.input}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Enter the admin password"
              autoComplete="current-password"
            />
            <Button type="submit" variant="primary" disabled={loginLoading || !password.trim()}>
              {loginLoading ? 'Checking…' : 'Sign in'}
            </Button>
          </form>
          {error && <ErrorState message={error} />}
        </div>
      </div>
    );
  }

  const offline = data?.offline ?? false;
  const status = data?.status ?? null;
  const unavailable = offline || !status;

  return (
    <div className={styles.root}>
      <PageHeader
        title={data ? `${data.info.display_name} Admin` : 'Server Admin'}
        subtitle={data ? `${data.info.game} · server admin page` : undefined}
        actions={(
          <div className={styles.headerActions}>
            <Link to={`/servers/${encodeURIComponent(slug)}`} className={styles.linkButton}>Back to server</Link>
            <Button type="button" variant="secondary" onClick={handleRefresh} disabled={loading || saving}>
              {loading ? 'Refreshing…' : 'Refresh'}
            </Button>
            <Button type="button" variant="ghost" onClick={() => { clearProtectedState(); setError(null); }}>
              Sign out
            </Button>
          </div>
        )}
      />

      {error && <div role="alert"><ErrorState message={error} /></div>}
      {notice && <div className={styles.notice} role="status">{notice}</div>}
      {offline && (
        <div className={styles.offline} role="status">
          OFFLINE: this server's reporter can't be reached. Status and editing are unavailable.
        </div>
      )}

      {loading && !data && <LoadingState message="Loading admin data…" />}

      {data && form && (
        <>
          <section className={styles.card} aria-labelledby="info-title">
            <div className={styles.cardHeader}>
              <h2 id="info-title" className={styles.cardTitle}>Server Information</h2>
              {dirty && <span className={styles.unsaved}>Unsaved changes</span>}
            </div>

            <div className={styles.readOnlyGrid}>
              <StatusLine label="Server name" value={data.info.server_name} />
              <StatusLine label="Game" value={data.info.game} />
              <StatusLine label="Display name" value={data.info.display_name} />
            </div>

            <div className={styles.field}>
              <div className={styles.cardHeader}>
                <label className={styles.fieldTitle} htmlFor="description">Description</label>
                <Button type="button" variant="ghost" size="sm" onClick={() => setShowPreview((value) => !value)}>
                  {showPreview ? 'Edit' : 'Preview'}
                </Button>
              </div>
              {showPreview ? (
                <div className={styles.preview}>
                  {form.description.trim()
                    ? <MarkdownText content={form.description} />
                    : <p className={styles.muted}>Nothing to preview.</p>}
                </div>
              ) : (
                <textarea
                  id="description"
                  className={styles.textarea}
                  rows={6}
                  value={form.description}
                  disabled={offline}
                  onChange={(event) => setForm({ ...form, description: event.target.value })}
                />
              )}
            </div>

            <ListEditor label="News" items={form.news} disabled={offline} onChange={(news) => setForm({ ...form, news })} />
            <ListEditor label="Rules" items={form.rules} disabled={offline} onChange={(rules) => setForm({ ...form, rules })} />

            <div className={styles.saveRow}>
              <Button type="button" variant="primary" onClick={handleSave} disabled={!dirty || saving || offline}>
                {saving ? 'Saving…' : 'Save changes'}
              </Button>
            </div>
          </section>

          <section className={styles.card} aria-labelledby="status-title">
            <div className={styles.cardHeader}>
              <h2 id="status-title" className={styles.cardTitle}>Server Status &amp; Controls</h2>
              <div className={styles.headerActions}>
                <Button type="button" variant="primary" size="sm" disabled={offline} onClick={() => handleAction('start')}>
                  Start
                </Button>
                <Button type="button" variant="secondary" size="sm" disabled={offline} onClick={() => handleAction('restart')}>
                  Restart
                </Button>
              </div>
            </div>

            <div className={styles.metricsGrid}>
              <StatusLine label="Container status" value={unavailable ? null : status?.container.status} />
              <StatusLine label="CPU usage" value={unavailable || status?.container.cpu_usage == null ? null : `${status.container.cpu_usage}%`} />
              <StatusLine label="Disk usage" value={unavailable ? null : status?.container.disk_usage} />
              <StatusLine label="Server status" value={unavailable ? null : status?.server.status} />
              <ErrorLines label="Container errors" errors={unavailable ? null : status?.container.errors} />
              <ErrorLines label="Server errors" errors={unavailable ? null : status?.server.errors} />
            </div>
          </section>

          <section className={styles.card}>
            <EntryList title="Logs" entries={data.logs} emptyText="No logs available." />
          </section>

          <section className={styles.card}>
            <EntryList title="Errors" entries={data.errors} emptyText="No errors available." />
          </section>
        </>
      )}
    </div>
  );
}
