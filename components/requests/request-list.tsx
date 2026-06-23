'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { format, parseISO } from 'date-fns';
import { MessageSquare, ChevronRight, AlertTriangle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { RequestStatusBadge } from '@/components/requests/request-status-badge';
import type { OwnerRequestRow } from '@/lib/data/requests-data';

interface RequestListProps {
  requests: OwnerRequestRow[];
}

type FilterKey = 'all' | 'open' | 'closed';

const CATEGORY_LABELS: Record<string, string> = {
  personal_stay: 'Personal Stay',
  maintenance_request: 'Maintenance',
  amenity_addition: 'Amenity Addition',
  pricing_inquiry: 'Pricing Inquiry',
  payout_inquiry: 'Payout Inquiry',
  document_request: 'Document Request',
  contract_inquiry: 'Contract Inquiry',
  general_inquiry: 'General Inquiry',
  general: 'General',
  financial_inquiry: 'Financial Inquiry',
};

const OPEN_STATUSES = new Set(['pending', 'in_review', 'approved']);
const CLOSED_STATUSES = new Set(['completed', 'rejected', 'cancelled']);

const PRIORITY_INDICATOR: Record<string, { label: string; className: string } | undefined> = {
  high: { label: 'High', className: 'text-orange-600 bg-orange-50 border-orange-200' },
  urgent: { label: 'Urgent', className: 'text-taksu-terracotta bg-taksu-terracotta/10 border-taksu-terracotta/20' },
};

const FILTER_TABS: { key: FilterKey; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'open', label: 'Open' },
  { key: 'closed', label: 'Resolved' },
];

export function RequestList({ requests }: RequestListProps) {
  const router = useRouter();
  const [filter, setFilter] = useState<FilterKey>('all');

  const filteredRequests = requests.filter((req) => {
    if (filter === 'all') return true;
    if (filter === 'open') return OPEN_STATUSES.has(req.status);
    return CLOSED_STATUSES.has(req.status);
  });

  const openCount = requests.filter((r) => OPEN_STATUSES.has(r.status)).length;

  if (requests.length === 0) {
    return (
      <Card className="border-border">
        <CardContent className="flex flex-col items-center justify-center p-12 text-center">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-taksu-parchment">
            <MessageSquare className="h-7 w-7 text-taksu-sage" />
          </div>
          <h3 className="font-serif text-lg font-medium text-taksu-forest">No requests yet</h3>
          <p className="mt-2 text-sm text-taksu-sage max-w-xs">
            Submit a request for maintenance, personal stays, questions, or anything else and our
            team will get back to you within 24 hours.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filter tabs */}
      <div className="flex items-center gap-2">
        {FILTER_TABS.map(({ key, label }) => {
          const isActive = filter === key;
          return (
            <button
              key={key}
              onClick={() => setFilter(key)}
              className={`relative px-4 py-1.5 text-sm font-medium rounded-full transition-all ${
                isActive
                  ? 'bg-taksu-forest text-white shadow-sm'
                  : 'bg-taksu-cream text-taksu-sage hover:bg-taksu-parchment hover:text-taksu-forest'
              }`}
            >
              {label}
              {key === 'open' && openCount > 0 && (
                <span className={`ml-1.5 inline-flex items-center justify-center h-4 min-w-4 px-1 rounded-full text-[10px] font-bold ${
                  isActive ? 'bg-white/30 text-white' : 'bg-amber-100 text-amber-700'
                }`}>
                  {openCount}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {filteredRequests.length === 0 ? (
        <Card className="border-border">
          <CardContent className="flex flex-col items-center justify-center p-10 text-center">
            <p className="text-sm text-taksu-sage">No requests match this filter.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3">
          {filteredRequests.map((req) => {
            const priorityIndicator = PRIORITY_INDICATOR[req.priority];
            const isClosed = CLOSED_STATUSES.has(req.status);

            return (
              <Card
                key={req.id}
                className={`overflow-hidden border-border transition-all hover:shadow-md cursor-pointer group ${
                  isClosed ? 'opacity-70 hover:opacity-100' : ''
                }`}
                onClick={() => router.push(`/requests/${req.id}`)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => e.key === 'Enter' && router.push(`/requests/${req.id}`)}
              >
                <div className="p-5">
                  <div className="flex items-start justify-between gap-4">
                    {/* Left side */}
                    <div className="flex-1 min-w-0 space-y-1.5">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-semibold uppercase tracking-wider text-taksu-sage">
                          {CATEGORY_LABELS[req.category] ?? req.category}
                        </span>
                        {priorityIndicator && (
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${priorityIndicator.className}`}
                          >
                            {priorityIndicator.label} Priority
                          </span>
                        )}
                        {req.status === 'in_review' && (
                          <span className="flex items-center gap-1 text-[10px] font-semibold text-amber-600">
                            <span className="relative flex h-2 w-2">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
                              <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500" />
                            </span>
                            Active
                          </span>
                        )}
                      </div>
                      <h4 className="font-medium text-taksu-forest truncate pr-2">{req.subject}</h4>
                      <p className="text-sm text-taksu-sage line-clamp-1">{req.description}</p>
                    </div>

                    {/* Right side */}
                    <div className="shrink-0 flex flex-col items-end gap-2">
                      <RequestStatusBadge status={req.status as any} />
                      <span className="text-xs text-taksu-sage">
                        {format(parseISO(req.created_at || ''), 'MMM d, yyyy')}
                      </span>
                    </div>

                    {/* Chevron */}
                    <ChevronRight className="shrink-0 h-4 w-4 text-taksu-sage/40 group-hover:text-taksu-sage transition-colors mt-1" />
                  </div>

                  {/* Admin response preview */}
                  {req.admin_response && (
                    <div className="mt-3 pt-3 border-t border-border/60 flex items-start gap-2">
                      <div className="h-5 w-5 rounded-full bg-taksu-bamboo/20 flex items-center justify-center shrink-0 mt-0.5">
                        <span className="text-[9px] font-bold text-taksu-bamboo">T</span>
                      </div>
                      <p className="text-xs text-taksu-sage italic line-clamp-1">
                        Taksu Team: {req.admin_response}
                      </p>
                    </div>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Summary footer */}
      {requests.length > 0 && (
        <p className="text-xs text-taksu-sage text-right pt-1">
          {filteredRequests.length} of {requests.length} request{requests.length !== 1 ? 's' : ''}
        </p>
      )}
    </div>
  );
}
