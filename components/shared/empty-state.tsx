import { cn } from '@/lib/utils/cn';
import type { LucideIcon } from 'lucide-react';

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

export function EmptyState({ icon: Icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center rounded-lg border border-dashed border-border bg-card/50 px-6 py-16 text-center',
        className
      )}
    >
      {Icon && (
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-taksu-parchment">
          <Icon className="h-6 w-6 text-taksu-sage" />
        </div>
      )}
      <h3 className="font-serif text-lg font-semibold text-taksu-forest">{title}</h3>
      {description && <p className="mt-1 max-w-sm text-sm text-taksu-sage">{description}</p>}
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}
