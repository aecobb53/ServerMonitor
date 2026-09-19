const TRUSTED_DOMAINS = [
  'nax.lol',
  'valheim.fandom.com',
  'discord.com',
  'store.steampowered.com',
];

function normalizeHostname(hostname: string): string {
  return hostname.trim().toLowerCase().replace(/\.+$/, '');
}

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