import { cn } from '@/lib/cn';

interface PopoverSectionProps {
  title: string;
  children: React.ReactNode;
  className?: string;
}

export const PopoverSection = ({
  title,
  children,
  className,
}: PopoverSectionProps) => {
  return (
    <div className={cn('flex flex-col gap-2', className)}>
      <p className="text-sm font-emphasize text-grey-100">{title}</p>
      <div className="flex flex-col gap-2">{children}</div>
    </div>
  );
};
