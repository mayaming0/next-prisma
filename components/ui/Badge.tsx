type BadgeVariant = 'admin' | 'user';

interface BadgeProps {
  variant: BadgeVariant;
  children: string;
  className?: string;
}

export default function Badge({ variant, children, className = '' }: BadgeProps) {
  return (
    <span className={`badge badge-${variant} ${className}`}>
      {children}
    </span>
  );
}
