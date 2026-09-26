import { Fragment, type ReactNode } from "react";

/**
 * Minimal, safe inline formatting for the "text" block:
 *   **bold**   *italic*   [label](https://link)
 * Blank lines separate paragraphs; single newlines become <br>.
 * Output is React nodes — never raw HTML — so there is nothing to sanitise.
 */

const INLINE = /(\*\*[^*]+\*\*|\*[^*]+\*|\[[^\]]+\]\([^)\s]+\))/g;
const LINK = /^\[([^\]]+)\]\(([^)\s]+)\)$/;

function safeHref(href: string): string | null {
  if (/^(https?:|mailto:|tel:|\/|#)/i.test(href)) return href;
  return null;
}

function renderInline(text: string, keyPrefix: string): ReactNode[] {
  return text.split(INLINE).map((part, i) => {
    const key = `${keyPrefix}-${i}`;
    if (part.startsWith("**") && part.endsWith("**") && part.length > 4) {
      return <strong key={key}>{part.slice(2, -2)}</strong>;
    }
    if (part.startsWith("*") && part.endsWith("*") && part.length > 2) {
      return <em key={key}>{part.slice(1, -1)}</em>;
    }
    const link = part.match(LINK);
    if (link) {
      const href = safeHref(link[2]!);
      if (!href) return link[1];
      const external = /^https?:/i.test(href);
      return (
        <a key={key} href={href} {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}>
          {link[1]}
        </a>
      );
    }
    return part;
  });
}

export function RichText({ text }: { text: string }) {
  const paragraphs = text.trim().split(/\n\s*\n/);
  return (
    <div className="prose-body">
      {paragraphs.map((paragraph, p) => (
        <p key={p}>
          {paragraph.split("\n").map((line, l) => (
            <Fragment key={l}>
              {l > 0 && <br />}
              {renderInline(line, `${p}-${l}`)}
            </Fragment>
          ))}
        </p>
      ))}
    </div>
  );
}
