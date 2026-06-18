'use client';

import { useState } from 'react';
import { format, parseISO } from 'date-fns';
import { MessageSquare, Clock, CheckCircle2, AlertCircle, RefreshCw } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import type { OwnerRequestRow } from '@/lib/data/requests-data';

interface RequestListProps {
  requests: OwnerRequestRow[];
}

export function RequestList({ requests }: RequestListProps) {
  const [filter, setFilter] = useState<'all' | 'pending' | 'completed'>('all');

  const filteredRequests = requests.filter(req => {
    if (filter === 'all') return true;
    if (filter === 'completed') return req.status === 'completed' || req.status === 'rejected';
    return req.status === 'pending' || req.status === 'in_review';
  });

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'pending':
        return { label: 'Pending', icon: Clock, color: 'text-taksu-sage bg-taksu-sage/10' };
      case 'in_review':
        return { label: 'In Review', icon: RefreshCw, color: 'text-amber-600 bg-amber-100' };
      case 'completed':
        return { label: 'Completed', icon: CheckCircle2, color: 'text-taksu-jungle bg-taksu-jungle/10' };
      case 'rejected':
        return { label: 'Rejected', icon: AlertCircle, color: 'text-taksu-terracotta bg-taksu-terracotta/10' };
      default:
        return { label: status, icon: MessageSquare, color: 'text-taksu-sage bg-taksu-sage/10' };
    }
  };

  const getCategoryLabel = (category: string) => {
    return category.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-2 mb-6">
        <button 
          onClick={() => setFilter('all')}
          className={`px-3 py-1.5 text-sm font-medium rounded-full transition-colors ${filter === 'all' ? 'bg-taksu-forest text-white' : 'bg-taksu-cream text-taksu-sage hover:bg-taksu-parchment'}`}
        >
          All Requests
        </button>
        <button 
          onClick={() => setFilter('pending')}
          className={`px-3 py-1.5 text-sm font-medium rounded-full transition-colors ${filter === 'pending' ? 'bg-taksu-forest text-white' : 'bg-taksu-cream text-taksu-sage hover:bg-taksu-parchment'}`}
        >
          Open
        </button>
        <button 
          onClick={() => setFilter('completed')}
          className={`px-3 py-1.5 text-sm font-medium rounded-full transition-colors ${filter === 'completed' ? 'bg-taksu-forest text-white' : 'bg-taksu-cream text-taksu-sage hover:bg-taksu-parchment'}`}
        >
          Resolved
        </button>
      </div>

      {filteredRequests.length === 0 ? (
        <Card className="border-border">
          <CardContent className="flex flex-col items-center justify-center p-12 text-center">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-taksu-parchment">
              <MessageSquare className="h-6 w-6 text-taksu-sage" />
            </div>
            <h3 className="font-medium text-taksu-forest">No requests found</h3>
            <p className="mt-1 text-sm text-taksu-sage">
              You haven't submitted any requests that match this filter.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {filteredRequests.map(req => {
            const config = getStatusConfig(req.status);
            const StatusIcon = config.icon;
            
            return (
              <Card key={req.id} className="overflow-hidden border-border transition-shadow hover:shadow-md">
                <div className="p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold uppercase tracking-wider text-taksu-sage">
                          {getCategoryLabel(req.category)}
                        </span>
                        {req.priority === 'high' && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-taksu-terracotta/10 text-taksu-terracotta uppercase">
                            High Priority
                          </span>
                        )}
                      </div>
                      <h4 className="font-serif text-lg font-medium text-taksu-forest">{req.subject}</h4>
                      <p className="text-sm text-taksu-sage line-clamp-2 mt-2">{req.description}</p>
                    </div>
                    
                    <div className="shrink-0 flex flex-col items-end gap-2">
                      <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${config.color}`}>
                        <StatusIcon className="h-3.5 w-3.5" />
                        {config.label}
                      </div>
                      <span className="text-xs text-taksu-sage">
                        {format(parseISO(req.created_at || ''), 'MMM d, yyyy')}
                      </span>
                    </div>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
