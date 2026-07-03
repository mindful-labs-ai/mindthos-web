import { cn } from '@/lib/cn';

import { getClientAvatarPalette } from '../utils/clientAvatarPalette';

interface ClientAvatarProps {
  paletteKey: string;
  name: string;
  size?: number;
  className?: string;
}

export const ClientAvatar = ({
  paletteKey,
  name,
  size = 40,
  className,
}: ClientAvatarProps) => {
  const palette = getClientAvatarPalette(paletteKey);
  const initial = name?.trim()?.[0] ?? '?';

  return (
    <div
      className={cn(
        'flex flex-shrink-0 items-center justify-center rounded-full border text-l font-medium text-grey-100',
        palette.bg,
        palette.border,
        className
      )}
      style={{ width: size, height: size }}
    >
      {initial}
    </div>
  );
};
