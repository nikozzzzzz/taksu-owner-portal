import { Clock, RefreshCw, CheckCircle2, AlertCircle, XCircle, ThumbsUp } from 'lucide-react';

type RequestStatus = 'pending' | 'in_review' | 'approved' | 'rejected' | 'completed' | 'cancelled';

interface RequestStatusBadgeProps {
  status: RequestStatus;
  size?: 'sm' | 'md';
}

const STATUS_CONFIG: Record<
  RequestStatus,
  { label: string; Icon: React.ElementType; className: string }
> = {
  pending: {
    label: 'Pending',
    Icon: Clock,
    className: 'text-taksu-sage bg-taksu-sage/10 border-taksu-sage/20',
  },
  in_review: {
    label: 'In Review',
    Icon: RefreshCw,
    className: 'text-amber-600 bg-amber-50 border-amber-200',
  },
  approved: {
    label: 'Approved',
    Icon: ThumbsUp,
    className: 'text-emerald-600 bg-emerald-50 border-emerald-200',
  },
  completed: {
    label: 'Completed',
    Icon: CheckCircle2,
    className: 'text-taksu-jungle bg-taksu-jungle/10 border-taksu-jungle/20',
  },
  rejected: {
    label: 'Rejected',
    Icon: AlertCircle,
    className: 'text-taksu-terracotta bg-taksu-terracotta/10 border-taksu-terracotta/20',
  },
  cancelled: {
    label: 'Cancelled',
    Icon: XCircle,
    className: 'text-zinc-500 bg-zinc-100 border-zinc-200',
  },
};

export function RequestStatusBadge({ status, size = 'md' }: RequestStatusBadgeProps) {
  const config = STATUS_CONFIG[status] ?? STATUS_CONFIG.pending;
  const { label, Icon, className } = config;

  const sizeClasses = size === 'sm'
    ? 'text-[10px] px-2 py-0.5 gap-1'
    : 'text-xs px-2.5 py-1 gap-1.5';

  return (
    <span
      className={`inline-flex items-center font-medium rounded-full border ${sizeClasses} ${className}`}
    >
      <Icon className={size === 'sm' ? 'h-3 w-3' : 'h-3.5 w-3.5'} />
      {label}
    </span>
  );
}
