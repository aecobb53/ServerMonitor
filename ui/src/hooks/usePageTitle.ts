import { useEffect } from 'react';

const BASE = 'Server Monitor';

/**
 * Sets the browser tab title.
 * - Pass no argument (or empty string) for the home page → "Server Monitor"
 * - Pass a page name for any other page → "Servers | Server Monitor"
 */
export function usePageTitle(page?: string) {
  useEffect(() => {
    document.title = page ? `${page} | ${BASE}` : BASE;
    return () => { document.title = BASE; };
  }, [page]);
}
