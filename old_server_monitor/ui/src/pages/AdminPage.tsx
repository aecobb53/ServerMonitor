import { useEffect, useMemo, useState } from 'react';
import { Button, ErrorState, LoadingState, PageHeader } from '@/components/ui';
import { api, type ApiResponse } from '@/api/client';
import { usePageTitle } from '@/hooks/usePageTitle';
import styles from './AdminPage.module.css';

type ServerStatus = 'UP' | 'DOWN' | 'UNKNOWN';

type AdminMod = {
  name: string;
  enabled: boolean;
  version: string;
};

type AdminServer = {
  name: string;
  container: {
    status: ServerStatus;
    cpu_usage: number | null;
    disk_usage: string;
    errors: string[];
  };
  server: {
    status: ServerStatus;
    errors: string[];
  };
  mods: AdminMod[];
};

type AdminContentItem = {
  image?: string;
  title?: string;
  text?: string;
};

type AdminPageData = {
  servers: AdminServer[];
  carousel: AdminContentItem[];
  feed: AdminContentItem[];
  whats_new: AdminContentItem[];
};

type PatchResult = {
  name: string;
  enabled: boolean;
  version: string;
  restart_required: boolean;
};

const EMPTY_DATA: AdminPageData = {
  servers: [],
  carousel: [],
  feed: [],
  whats_new: [],
};

function getAuthHeaders(password: string) {
  return { 'X-Admin-Password': password };
}

function readErrorMessage(response: ApiResponse<unknown>): string {
  if (response.success) {
    return 'Something went wrong.';
  }

  return response.error.message;
}

async function fetchAdminData(password: string): Promise<ApiResponse<AdminPageData>> {
  const primary = await api.get<AdminPageData>('/admin/login', {
    headers: getAuthHeaders(password),
  });

  if (primary.success) {
    return primary;
  }

  if (primary.error.code === 'HTTP_404' || primary.error.code === 'HTTP_405') {
    return api.get<AdminPageData>('/admin', {
      headers: getAuthHeaders(password),
    });
  }

  return primary;
}

function AdminStatusBadge({ status }: { status: ServerStatus }) {
  const normalized = status.toUpperCase() as ServerStatus;
  return (
    <span className={[styles.badge, styles[normalized.toLowerCase()]].join(' ')}>
      <span className={styles.dot} aria-hidden="true" />
      {normalized}
    </span>
  );
}

export default function AdminPage() {
  usePageTitle('Admin');

  const [password, setPassword] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [pageData, setPageData] = useState<AdminPageData>(EMPTY_DATA);
  const [loginLoading, setLoginLoading] = useState(false);
  const [dataLoading, setDataLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dirtyMods, setDirtyMods] = useState<Record<string, string[]>>({});

  useEffect(() => {
    return () => {
      setPassword('');
      setIsAuthenticated(false);
      setPageData(EMPTY_DATA);
      setDirtyMods({});
    };
  }, []);

  const refreshServerData = async (adminPassword: string) => {
    setDataLoading(true);
    setError(null);

    const response = await fetchAdminData(adminPassword);

    if (!response.success) {
      if (response.error.code === 'HTTP_401' || response.error.code === 'INVALID_ADMIN_PASSWORD') {
        setPassword('');
        setIsAuthenticated(false);
        setPageData(EMPTY_DATA);
        setDirtyMods({});
        setError('Authentication failed. Please sign in again.');
        setDataLoading(false);
        return;
      }

      setError(readErrorMessage(response));
      setDataLoading(false);
      return;
    }

    setPageData(response.data ?? EMPTY_DATA);
    setDataLoading(false);
  };

  async function handleLogin(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setLoginLoading(true);

    const response = await api.post<{ success: boolean; data: null }>('/admin/login', {
      password,
    });

    if (!response.success) {
      setError(readErrorMessage(response));
      setLoginLoading(false);
      return;
    }

    setIsAuthenticated(true);
    setLoginLoading(false);
    await refreshServerData(password);
  }

  async function handleRefresh() {
    if (!password) {
      setError('Please sign in first.');
      return;
    }

    await refreshServerData(password);
  }

  async function handleServerAction(serverName: string, action: 'start' | 'restart') {
    const actionText = action === 'start'
      ? 'This will start the server.'
      : 'This will restart the Valheim server. The server normally returns quickly, but in rare situations recovery may take up to 20 minutes.';

    const confirmed = window.confirm(`${action === 'start' ? 'Start' : 'Restart'} Server?\n\n${actionText}`);
    if (!confirmed) {
      return;
    }

    const response = await api.post<{ server: string; action: string }>(`/admin/servers/${encodeURIComponent(serverName)}/${action}`, {} as Record<string, never>, {
      headers: getAuthHeaders(password),
    });

    if (!response.success) {
      if (response.error.code === 'HTTP_401' || response.error.code === 'INVALID_ADMIN_PASSWORD') {
        setPassword('');
        setIsAuthenticated(false);
        setPageData(EMPTY_DATA);
        setDirtyMods({});
        setError('Authentication failed. Please sign in again.');
        return;
      }

      setError(typeof response.error.message === 'string' ? response.error.message : 'Unable to complete that server action.');
      return;
    }

    await refreshServerData(password);
  }

  function handleModChange(serverName: string, modName: string, enabled: boolean, version: string) {
    setPageData((current) => ({
      ...current,
      servers: current.servers.map((server) => {
        if (server.name !== serverName) {
          return server;
        }

        return {
          ...server,
          mods: server.mods.map((mod) => mod.name === modName ? { ...mod, enabled, version } : mod),
        };
      }),
    }));

    setDirtyMods((current) => ({
      ...current,
      [serverName]: Array.from(new Set([...(current[serverName] ?? []), modName])),
    }));

    setError(null);
  }

  async function submitPendingModChanges() {
    const pending = Object.entries(dirtyMods).flatMap(([serverName, modNames]) => {
      const server = pageData.servers.find((entry) => entry.name === serverName);
      if (!server) {
        return [];
      }

      return modNames
        .map((modName) => {
          const mod = server.mods.find((entry) => entry.name === modName);
          if (!mod) {
            return null;
          }

          return {
            serverName,
            modName,
            enabled: mod.enabled,
            version: mod.version,
          };
        })
        .filter((entry): entry is { serverName: string; modName: string; enabled: boolean; version: string } => entry !== null);
    });

    if (pending.length === 0) {
      return;
    }

    for (const change of pending) {
      const response = await api.patch<PatchResult>(`/admin/servers/${encodeURIComponent(change.serverName)}/mods/${encodeURIComponent(change.modName)}`, {
        enabled: change.enabled,
        version: change.version,
      }, {
        headers: getAuthHeaders(password),
      });

      if (!response.success) {
        if (response.error.code === 'HTTP_401' || response.error.code === 'INVALID_ADMIN_PASSWORD') {
          setPassword('');
          setIsAuthenticated(false);
          setPageData(EMPTY_DATA);
          setDirtyMods({});
          setError('Authentication failed. Please sign in again.');
          return;
        }

        setError(typeof response.error.message === 'string' ? response.error.message : 'Unable to save one or more mod changes.');
        return;
      }
    }

    setDirtyMods({});
    setError(null);
    await refreshServerData(password);
  }

  const restartRequiredServers = useMemo(
    () => Object.keys(dirtyMods).filter((serverName) => (dirtyMods[serverName] ?? []).length > 0),
    [dirtyMods],
  );

  const pendingModCount = useMemo(
    () => Object.values(dirtyMods).reduce((count, mods) => count + mods.length, 0),
    [dirtyMods],
  );

  const hasServerData = pageData.servers.length > 0;

  if (!isAuthenticated) {
    return (
      <div className={styles.root}>
        <PageHeader title="Admin" subtitle="Restricted maintenance area. Sign in to continue." />
        <div className={styles.loginCard}>
          <form className={styles.loginForm} onSubmit={handleLogin}>
            <label className={styles.fieldLabel} htmlFor="admin-password">
              Admin password
            </label>
            <input
              id="admin-password"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Enter the admin password"
              className={styles.input}
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

  return (
    <div className={styles.root}>
      <PageHeader
        title="Admin"
        subtitle="Admin does not automatically refresh. Use Refresh to fetch the latest server status."
        actions={(
          <div className={styles.headerActions}>
            <Button type="button" variant="secondary" onClick={handleRefresh} disabled={dataLoading}>
              {dataLoading ? 'Refreshing…' : 'Refresh'}
            </Button>
            <Button
              type="button"
              variant="ghost"
              onClick={() => {
                setPassword('');
                setIsAuthenticated(false);
                setPageData(EMPTY_DATA);
                setDirtyMods({});
                setError(null);
              }}
            >
              Sign out
            </Button>
          </div>
        )}
      />

      {error && <div className={styles.notice}><ErrorState message={error} /></div>}

      {restartRequiredServers.length > 0 && (
        <div className={styles.restartBanner}>
          <h3>Pending mod changes</h3>
          <p>
            {pendingModCount} mod change{pendingModCount === 1 ? '' : 's'} waiting to be submitted:
            {' '}
            {restartRequiredServers.map((serverName) => {
              const names = dirtyMods[serverName] ?? [];
              return names.length ? `${serverName}: ${names.join(', ')}` : serverName;
            }).join(' | ')}
          </p>
          <div className={styles.bannerActions}>
            <Button
              type="button"
              variant="primary"
              onClick={submitPendingModChanges}
            >
              Submit Changes
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={() => handleServerAction(restartRequiredServers[0], 'restart')}
            >
              Restart Server
            </Button>
          </div>
        </div>
      )}

      {dataLoading && <LoadingState message="Loading admin data…" />}

      {!dataLoading && !hasServerData && (
        <div className={styles.emptyState}>No admin server data is available right now.</div>
      )}

      {pageData.servers.length > 0 && (
        <div className={styles.serverGrid}>
          {pageData.servers.map((server) => (
            <div key={server.name} className={styles.serverCard}>
              <div className={styles.serverHeader}>
                <div>
                  <h2>{server.name}</h2>
                  <div className={styles.statusRow}>
                    <div className={styles.statusGroup}>
                      <span className={styles.statusLabel}>Container</span>
                      <AdminStatusBadge status={server.container.status} />
                    </div>
                    <div className={styles.statusGroup}>
                      <span className={styles.statusLabel}>Server</span>
                      <AdminStatusBadge status={server.server.status} />
                    </div>
                  </div>
                </div>
                <div className={styles.serverActions}>
                  <Button type="button" variant="primary" size="sm" onClick={() => handleServerAction(server.name, 'start')}>
                    Start
                  </Button>
                  <Button type="button" variant="secondary" size="sm" onClick={() => handleServerAction(server.name, 'restart')}>
                    Restart
                  </Button>
                </div>
              </div>

              <div className={styles.metricsGrid}>
                <div>
                  <label>CPU usage</label>
                  <strong>{server.container.cpu_usage ?? 'N/A'}%</strong>
                </div>
                <div>
                  <label>Disk usage</label>
                  <strong>{server.container.disk_usage}</strong>
                </div>
              </div>

              <div className={styles.modsSection}>
                <h3>Mods</h3>
                {(server.mods.length ? server.mods : [{ name: 'No mods installed', enabled: false, version: 'n/a' }]).map((mod) => {
                  const isDisabled = !mod.enabled;
                  const modKey = `${server.name}-${mod.name}`;
                  const changed = (dirtyMods[server.name] ?? []).includes(mod.name);

                  return (
                    <div key={modKey} className={[styles.modRow, isDisabled ? styles.modDisabled : ''].join(' ')}>
                      <div className={styles.modMeta}>
                        <span className={styles.modName}>{mod.name}</span>
                        <span className={styles.modState}>{mod.enabled ? 'Enabled' : 'Disabled'}</span>
                      </div>

                      <div className={styles.modInputs}>
                        <label className={styles.inlineField}>
                          <span>Status</span>
                          <select
                            value={String(mod.enabled)}
                            onChange={(event) => handleModChange(server.name, mod.name, event.target.value === 'true', mod.version)}
                          >
                            <option value="true">Enabled</option>
                            <option value="false">Disabled</option>
                          </select>
                        </label>

                        <label className={styles.inlineField}>
                          <span>Version</span>
                          <input
                            type="text"
                            value={mod.version}
                            onChange={(event) => handleModChange(server.name, mod.name, mod.enabled, event.target.value)}
                          />
                        </label>
                      </div>

                      {changed && <span className={styles.changedFlag}>Changed</span>}
                    </div>
                  );
                })}
              </div>

              <div className={styles.errorBlock}>
                <label>Container errors</label>
                <ul>
                  {(server.container.errors.length ? server.container.errors : ['None']).map((message) => (
                    <li key={`${server.name}-container-${message}`}>{message}</li>
                  ))}
                </ul>
              </div>

              <div className={styles.errorBlock}>
                <label>Server errors</label>
                <ul>
                  {(server.server.errors.length ? server.server.errors : ['None']).map((message) => (
                    <li key={`${server.name}-server-${message}`}>{message}</li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className={styles.contentGrid}>
        <div className={styles.contentCard}>
          <h3>Carousel</h3>
          {pageData.carousel.length ? (
            pageData.carousel.map((item, index) => (
              <div key={`carousel-${index}`} className={styles.itemEditor}>
                <input type="text" value={item.image ?? ''} readOnly />
                <input type="text" value={item.title ?? ''} readOnly />
              </div>
            ))
          ) : (
            <p>No carousel items configured.</p>
          )}
        </div>

        <div className={styles.contentCard}>
          <h3>Feed</h3>
          {pageData.feed.length ? (
            pageData.feed.map((item, index) => (
              <div key={`feed-${index}`} className={styles.itemEditor}>
                <textarea value={item.text ?? ''} readOnly />
              </div>
            ))
          ) : (
            <p>No feed items configured.</p>
          )}
        </div>

        <div className={styles.contentCard}>
          <h3>What&apos;s New</h3>
          {pageData.whats_new.length ? (
            pageData.whats_new.map((item, index) => (
              <div key={`whats-new-${index}`} className={styles.itemEditor}>
                <textarea value={item.text ?? ''} readOnly />
              </div>
            ))
          ) : (
            <p>No updates configured.</p>
          )}
        </div>
      </div>
    </div>
  );
}
