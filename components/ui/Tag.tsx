'use client';

interface TagProps {
  children: string;
  onRemove?: () => void;
  className?: string;
}

export default function Tag({ children, onRemove, className = '' }: TagProps) {
  return (
    <span className={`tag ${className}`}>
      {children}
      {onRemove && (
        <span className="tag-remove" onClick={onRemove}>
          &times;
        </span>
      )}
    </span>
  );
}
