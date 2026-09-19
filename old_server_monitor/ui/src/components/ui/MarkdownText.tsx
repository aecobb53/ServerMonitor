import ReactMarkdown from 'react-markdown';
import remarkBreaks from 'remark-breaks';
import remarkGfm from 'remark-gfm';
import { classifyLinkHref } from '@/utils/linkTrust';
import styles from './MarkdownText.module.css';

interface MarkdownTextProps {
  content: string;
  className?: string;
}

type MarkdownNode = {
  type?: string;
  value?: string;
  url?: string;
  children?: MarkdownNode[];
  data?: {
    hName?: string;
    hProperties?: {
      className?: string[];
    };
  };
};

const COLOR_TOKENS = new Set([
  'red',
  'green',
  'blue',
  'orange',
  'yellow',
  'white',
  'black',
  'purple',
  'poor',
  'common',
  'uncommon',
  'rare',
  'epic',
  'legendary',
  'ancient',
  'mythic',
]);

const ICON_TOKENS = new Set([
  'poor',
  'common',
  'uncommon',
  'rare',
  'epic',
  'legendary',
  'ancient',
  'mythic',
]);

function isSafeHref(href: string): boolean {
  const value = href.trim().toLowerCase();
  return value.startsWith('http://')
    || value.startsWith('https://')
    || value.startsWith('mailto:')
    || value.startsWith('/')
    || value.startsWith('#');
}

function remarkSubSuper() {
  return (tree: MarkdownNode) => {
    const transformNode = (node: MarkdownNode) => {
      if (!node.children) {
        return;
      }

      const nextChildren: MarkdownNode[] = [];

      node.children.forEach((child) => {
        if (child.type !== 'text' || typeof child.value !== 'string') {
          transformNode(child);
          nextChildren.push(child);
          return;
        }

        const text = child.value;
        const pattern = /\[\[color:([a-z_]+)(\+icon)?\]([^\n\]]+?)\[\/color\]\]\(([^)\s]+)\)|\[color:([a-z_]+)(\+icon)?\]([^\n]+?)\[\/color\]|\[highlight:(yellow|green|blue|red|orange)\]([^\n]+?)\[\/highlight\]|(?<!\^)\^([^\^\n]+)\^(?!\^)|(?<!~)~([^~\n]+)~(?!~)/g;
        let lastIndex = 0;
        let match: RegExpExecArray | null;

        while ((match = pattern.exec(text)) !== null) {
          if (match.index > lastIndex) {
            nextChildren.push({ type: 'text', value: text.slice(lastIndex, match.index) });
          }

          if (match[1] && match[3] && match[4]) {
            const token = match[1].toLowerCase();
            const iconRequested = Boolean(match[2]);

            if (!COLOR_TOKENS.has(token)) {
              nextChildren.push({ type: 'text', value: match[0] });
              lastIndex = pattern.lastIndex;
              return;
            }

            const classNames = [`md-color-${token}`];
            if (iconRequested && ICON_TOKENS.has(token)) {
              classNames.push('md-with-icon', `md-icon-${token}`);
            }

            nextChildren.push({
              type: 'link',
              url: match[4],
              children: [{
                type: 'colored_text',
                children: [{ type: 'text', value: match[3] }],
                data: { hName: 'span', hProperties: { className: classNames } },
              }],
            });
          } else if (match[5] && match[7]) {
            const token = match[5].toLowerCase();
            const iconRequested = Boolean(match[6]);

            if (!COLOR_TOKENS.has(token)) {
              nextChildren.push({ type: 'text', value: match[0] });
              lastIndex = pattern.lastIndex;
              return;
            }

            const classNames = [`md-color-${token}`];
            if (iconRequested && ICON_TOKENS.has(token)) {
              classNames.push('md-with-icon', `md-icon-${token}`);
            }

            nextChildren.push({
              type: 'colored_text',
              children: [{ type: 'text', value: match[7] }],
              data: { hName: 'span', hProperties: { className: classNames } },
            });
          } else if (match[8] && match[9]) {
            nextChildren.push({
              type: 'highlighted_text',
              children: [{ type: 'text', value: match[9] }],
              data: { hName: 'span', hProperties: { className: [`md-highlight-${match[8]}`] } },
            });
          } else if (match[10]) {
            nextChildren.push({
              type: 'superscript',
              children: [{ type: 'text', value: match[10] }],
              data: { hName: 'sup' },
            });
          } else if (match[11]) {
            nextChildren.push({
              type: 'subscript',
              children: [{ type: 'text', value: match[11] }],
              data: { hName: 'sub' },
            });
          }

          lastIndex = pattern.lastIndex;
        }

        if (lastIndex < text.length) {
          nextChildren.push({ type: 'text', value: text.slice(lastIndex) });
        }
      });

      node.children = nextChildren;
    };

    transformNode(tree);
  };
}

export default function MarkdownText({ content, className = '' }: MarkdownTextProps) {
  const classes = [styles.markdown, className].filter(Boolean).join(' ');

  return (
    <div className={classes}>
      <ReactMarkdown
        remarkPlugins={[remarkBreaks, remarkSubSuper, [remarkGfm, { singleTilde: false }]]}
        skipHtml
        components={{
          a: ({ href, children }) => {
            if (!href) {
              return (
                <span className={styles.untrustedInline}>
                  <span>{children}</span>
                  <span className={styles.untrustedBadge}>Not trusted</span>
                </span>
              );
            }

            const verdict = classifyLinkHref(href);

            if (!isSafeHref(href) || !verdict.clickable) {
              return (
                <span className={styles.untrustedInline}>
                  <span>{children}</span>
                  <span className={styles.untrustedBadge}>Not trusted</span>
                </span>
              );
            }

            const linkClass = verdict.trusted
              ? styles.link
              : `${styles.link} ${styles.linkUntrusted}`;

            return (
              <span className={styles.linkWrap}>
                <a href={href} className={linkClass} rel="noreferrer noopener" target="_blank">
                  {children}
                </a>
                {!verdict.trusted && <span className={styles.untrustedBadge}>Not trusted</span>}
              </span>
            );
          },
          code: ({ children }) => <code className={styles.inlineCode}>{children}</code>,
          pre: ({ children }) => <>{children}</>,
          sub: ({ children }) => <sub className={styles.subsup}>{children}</sub>,
          sup: ({ children }) => <sup className={styles.subsup}>{children}</sup>,
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}