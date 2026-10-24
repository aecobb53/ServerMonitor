declare global {
  interface Window {
    __CONFIG__?: { trustedDomains?: string };
  }
}

function normalizeHostname(hostname: string): string {
  return hostname.trim().toLowerCase().replace(/\.+$/, '');
}

// Comes from the TRUSTED_DOMAINS env var via /config.js; empty means nothing is trusted.
const TRUSTED_DOMAINS = (window.__CONFIG__?.trustedDomains ?? '')
  .split(',')
  .map(normalizeHostname)
  .filter(Boolean);

export function isTrustedHostname(hostname: string): boolean {
  const host = normalizeHostname(hostname);
  return TRUSTED_DOMAINS.some((domain) => host === domain || host.endsWith(`.${domain}`));
}

export interface LinkVerdict {
  trusted: boolean;
  clickable: boolean;
}

export function classifyLinkHref(href: string): LinkVerdict {
  const value = href.trim();

  if (!value) {
    return { trusted: false, clickable: false };
  }

  if (value.startsWith('/') || value.startsWith('#')) {
    return { trusted: true, clickable: true };
  }

  let url: URL;
  try {
    url = new URL(value);
  } catch {
    return { trusted: false, clickable: false };
  }

  const protocol = url.protocol.toLowerCase();
  if (protocol === 'http:' || protocol === 'https:') {
    return {
      trusted: isTrustedHostname(url.hostname),
      clickable: true,
    };
  }

  if (protocol === 'mailto:') {
    return { trusted: false, clickable: true };
  }

  return { trusted: false, clickable: false };
}

export function getTrustedDomains(): string[] {
  return [...TRUSTED_DOMAINS];
}