import type { HTMLAttributes } from 'react';
import styles from './Card.module.css';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  /** When true, applies hover state and pointer cursor */
  interactive?: boolean;
}

export default function Card({
  interactive = false,
  className = '',
  children,
  ...rest
}: CardProps) {
  const classes = [
    styles.card,
    interactive ? styles.interactive : '',
    className,
  ].filter(Boolean).join(' ');

  return (
    <div className={classes} {...rest}>
      {children}
    </div>
  );
}
