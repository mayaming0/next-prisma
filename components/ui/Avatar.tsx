type AvatarSize = 'sm' | 'md' | 'lg';

interface AvatarProps {
  name: string;
  size?: AvatarSize;
  className?: string;
}

export default function Avatar({ name, size = 'md', className = '' }: AvatarProps) {
  const initial = name.charAt(0).toUpperCase();
  const sizeClass = `avatar-${size}`;

  return (
    <div className={`avatar ${sizeClass} ${className}`}>
      {initial}
    </div>
  );
}
