import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

function slugify(text: string): string {
  return text
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\u4e00-\u9fa5]+/g, '-')
    .replace(/^-|-$/g, '');
}

interface MarkdownRendererProps {
  content: string;
  className?: string;
  addHeadingIds?: boolean;
}

export default function MarkdownRenderer({
  content,
  className = '',
  addHeadingIds = false,
}: MarkdownRendererProps) {
  const components = addHeadingIds
    ? {
        h2: ({ children, ...props }: { children?: React.ReactNode; [key: string]: unknown }) => {
          const text = String(children);
          const id = `section-${slugify(text)}`;
          return <h2 id={id} {...props}>{children}</h2>;
        },
      }
    : undefined;

  return (
    <div className={`markdown-body ${className}`}>
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
        {content}
      </ReactMarkdown>
    </div>
  );
}
