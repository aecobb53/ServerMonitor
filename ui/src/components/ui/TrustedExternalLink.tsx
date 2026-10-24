import type { MouseEventHandler, ReactNode } from 'react';
import { classifyLinkHref } from '@/utils/linkTrust';
import styles from './TrustedExternalLink.module.css';

interface TrustedExternalLinkProps {
  href: string;
  children: ReactNode;
  className?: string;
  onClick?: MouseEventHandler<HTMLAnchorElement>;
}

export default function TrustedExternalLink({ href, children, className = '', onClick }: TrustedExternalLinkProps) {
  const verdict = classifyLinkHref(href);

  if (!verdict.clickable) {
    return (
      <span className={styles.inlineWrap}>
        <span>{children}</span>
        <span className={styles.badge}>Not trusted</span>
      </span>
    );
  }

  const classes = [
    className,
    verdict.trusted ? '' : styles.untrusted,
  ].filter(Boolean).join(' ');

  return (
    <a href={href} className={classes} rel="noreferrer noopener" target="_blank" onClick={onClick}>
      {children}
      {!verdict.trusted && <span className={styles.badge}>Not trusted</span>}
    </a>
  );
}