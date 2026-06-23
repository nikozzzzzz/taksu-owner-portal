'use client';

import { useState, useRef, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { format, parseISO } from 'date-fns';
import {
  ArrowLeft,
  Send,
  Loader2,
  CalendarDays,
  User,
  Building2,
  AlertTriangle,
  XCircle,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { RequestStatusBadge } from '@/components/requests/request-status-badge';
import { updateRequestStatus } from '@/lib/actions/admin-actions';
import { cancelRequest, addComment } from '@/lib/actions/request-actions';
import type { RequestWithComments } from '@/lib/data/requests-data';

interface RequestDetailProps {
  request: RequestWithComments;
  isAdmin?: boolean;
}

const CATEGORY_LABELS: Record<string, string> = {
  personal_stay: 'Personal Stay',
  maintenance_request: 'Maintenance Report',
  amenity_addition: 'Amenity Addition',
  pricing_inquiry: 'Pricing Inquiry',
  payout_inquiry: 'Payout Inquiry',
  document_request: 'Document Request',
  contract_inquiry: 'Contract Inquiry',
  general_inquiry: 'General Inquiry',
  general: 'General',
  financial_inquiry: 'Financial Inquiry',
};

const STATUS_STEPS = [
  { key: 'pending', label: 'Submitted' },
  { key: 'in_review', label: 'In Review' },
  { key: 'approved', label: 'Approved' },
  { key: 'completed', label: 'Completed' },
] as const;

const TERMINAL_STATUSES = new Set(['completed', 'rejected', 'cancelled']);

function StatusTimeline({ status }: { status: string }) {
  if (status === 'cancelled') {
    return (
      <div className="flex items-center gap-2 text-sm text-zinc-500">
        <XCircle className="h-4 w-4" />
        This request was cancelled.
      </div>
    );
  }
  if (status === 'rejected') {
    return (
      <div className="flex items-center gap-2 text-sm text-taksu-terracotta">
        <AlertTriangle className="h-4 w-4" />
        This request was not approved.
      </div>
    );
  }

  const currentIndex = STATUS_STEPS.findIndex((s) => s.key === status);
  const effectiveIndex = currentIndex === -1 ? 0 : currentIndex;

  return (
    <div className="flex items-center gap-0">
      {STATUS_STEPS.map((step, idx) => {
        const isDone = idx <= effectiveIndex;
        const isCurrent = idx === effectiveIndex;
        const isLast = idx === STATUS_STEPS.length - 1;

        return (
          <div key={step.key} className="flex items-center">
            <div className="flex flex-col items-center gap-1">
              <div
                className={`h-7 w-7 rounded-full border-2 flex items-center justify-center text-xs font-bold transition-all ${
                  isCurrent
                    ? 'border-taksu-bamboo bg-taksu-bamboo text-white ring-4 ring-taksu-bamboo/20'
                    : isDone
                    ? 'border-taksu-jungle bg-taksu-jungle text-white'
                    : 'border-zinc-200 bg-white text-zinc-300'
                }`}
              >
                {isDone && !isCurrent ? (
                  <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  idx + 1
                )}
              </div>
              <span
                className={`text-[10px] font-medium whitespace-nowrap ${
                  isCurrent ? 'text-taksu-bamboo' : isDone ? 'text-taksu-jungle' : 'text-zinc-400'
                }`}
              >
                {step.label}
              </span>
            </div>
            {!isLast && (
              <div
                className={`h-0.5 w-8 sm:w-16 mx-1 mb-4 rounded-full transition-all ${
                  idx < effectiveIndex ? 'bg-taksu-jungle' : 'bg-zinc-200'
                }`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

export function RequestDetail({ request, isAdmin = false }: RequestDetailProps) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [isPending, startTransition] = useTransition();
  const [commentError, setCommentError] = useState<string | null>(null);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [cancelError, setCancelError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  const isClosed = TERMINAL_STATUSES.has(request.status);
  const canCancel = request.status === 'pending';

  const handleComment = async (formData: FormData) => {
    setCommentError(null);
    startTransition(async () => {
      const result = await addComment(request.id, formData);
      if (result.error) {
        setCommentError(result.error);
      } else {
        formRef.current?.reset();
      }
    });
  };

  const handleCancel = async () => {
    setIsCancelling(true);
    setCancelError(null);
    const result = await cancelRequest(request.id);
    if (result.error) {
      setCancelError(result.error);
      setIsCancelling(false);
    } else {
      setCancelDialogOpen(false);
      router.refresh();
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    if (!isAdmin) return;
    setIsUpdatingStatus(true);
    setActionError(null);
    try {
      await updateRequestStatus(request.id, newStatus);
      router.refresh();
    } catch (err: any) {
      setActionError(err.message || 'Failed to update status');
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Back */}
      <button
        onClick={() => router.push('/requests')}
        className="flex items-center gap-1.5 text-sm text-taksu-sage hover:text-taksu-forest transition-colors group"
      >
        <ArrowLeft className="h-4 w-4 group-hover:-translate-x-0.5 transition-transform" />
        Back to Requests
      </button>

      {/* Header card */}
      <Card className="border-border overflow-hidden">
        <div className="bg-taksu-cream/40 px-6 py-5 border-b border-border">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div className="space-y-1">
              <span className="text-xs font-semibold uppercase tracking-wider text-taksu-sage">
                {CATEGORY_LABELS[request.category] ?? request.category}
              </span>
              <h1 className="font-serif text-xl font-medium text-taksu-forest">{request.subject}</h1>
              <p className="text-xs text-taksu-sage">
                Submitted on {format(parseISO(request.created_at), 'MMMM d, yyyy')}
                {request.resolved_at && (
                  <> · Resolved {format(parseISO(request.resolved_at), 'MMMM d, yyyy')}</>
                )}
              </p>
            </div>
            <RequestStatusBadge status={request.status as any} />
          </div>
        </div>

        <CardContent className="p-6 space-y-6">
          {/* Status timeline */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-taksu-sage mb-3">
              Progress
            </p>
            <StatusTimeline status={request.status} />
          </div>

          <Separator />

          {/* Metadata grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm">
            <div>
              <p className="text-xs text-taksu-sage mb-0.5">Priority</p>
              <p className="font-medium text-taksu-forest capitalize">{request.priority}</p>
            </div>
            {request.preferred_dates_start && (
              <div>
                <p className="text-xs text-taksu-sage mb-0.5 flex items-center gap-1">
                  <CalendarDays className="h-3 w-3" /> Check-in
                </p>
                <p className="font-medium text-taksu-forest">
                  {format(parseISO(request.preferred_dates_start), 'MMM d, yyyy')}
                </p>
              </div>
            )}
            {request.preferred_dates_end && (
              <div>
                <p className="text-xs text-taksu-sage mb-0.5 flex items-center gap-1">
                  <CalendarDays className="h-3 w-3" /> Check-out
                </p>
                <p className="font-medium text-taksu-forest">
                  {format(parseISO(request.preferred_dates_end), 'MMM d, yyyy')}
                </p>
              </div>
            )}
          </div>

          {/* Description */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-taksu-sage mb-2">
              Description
            </p>
            <p className="text-sm text-taksu-forest whitespace-pre-wrap leading-relaxed">
              {request.description}
            </p>
          </div>

          {/* Admin response block */}
          {request.admin_response && (
            <div className="rounded-lg border border-taksu-bamboo/30 bg-taksu-bamboo/5 p-4 space-y-2">
              <div className="flex items-center gap-2">
                <div className="h-6 w-6 rounded-full bg-taksu-bamboo/20 flex items-center justify-center">
                  <Building2 className="h-3.5 w-3.5 text-taksu-bamboo" />
                </div>
                <p className="text-xs font-semibold text-taksu-bamboo uppercase tracking-wider">
                  Response from Taksu Team
                </p>
              </div>
              <p className="text-sm text-taksu-forest whitespace-pre-wrap leading-relaxed pl-8">
                {request.admin_response}
              </p>
            </div>
          )}

          {/* Admin Controls */}
          {isAdmin && (
            <div className="pt-4 border-t border-border flex flex-wrap gap-2 justify-between items-center bg-taksu-cream/20 -mx-6 -mb-6 p-4 rounded-b-xl">
              <span className="text-sm font-semibold text-taksu-sage">Admin Actions:</span>
              <div className="flex gap-2">
                <Button 
                  size="sm" 
                  variant="outline" 
                  disabled={isUpdatingStatus || request.status === 'in_review'}
                  onClick={() => handleStatusChange('in_review')}
                >
                  Mark In Review
                </Button>
                <Button 
                  size="sm" 
                  variant="outline" 
                  className="bg-taksu-jungle/10 text-taksu-jungle border-taksu-jungle hover:bg-taksu-jungle/20"
                  disabled={isUpdatingStatus || request.status === 'approved'}
                  onClick={() => handleStatusChange('approved')}
                >
                  Approve
                </Button>
                <Button 
                  size="sm" 
                  variant="outline"
                  className="bg-zinc-100 text-zinc-700 hover:bg-zinc-200"
                  disabled={isUpdatingStatus || request.status === 'completed'}
                  onClick={() => handleStatusChange('completed')}
                >
                  Complete
                </Button>
                <Button 
                  size="sm" 
                  variant="outline" 
                  className="text-taksu-terracotta border-taksu-terracotta hover:bg-taksu-terracotta/10"
                  disabled={isUpdatingStatus || request.status === 'rejected'}
                  onClick={() => handleStatusChange('rejected')}
                >
                  Reject
                </Button>
              </div>
            </div>
          )}

          {/* Cancel button */}
          {!isAdmin && canCancel && (
            <div className="pt-2 border-t border-border flex justify-end">
              <Button
                variant="outline"
                size="sm"
                className="text-zinc-500 border-zinc-200 hover:border-taksu-terracotta hover:text-taksu-terracotta hover:bg-taksu-terracotta/5"
                onClick={() => setCancelDialogOpen(true)}
              >
                <XCircle className="mr-1.5 h-3.5 w-3.5" />
                Cancel Request
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Comment thread */}
      <div className="space-y-4">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-taksu-sage">
          Conversation ({request.comments.length})
        </h2>

        {request.comments.length === 0 && (
          <div className="text-sm text-taksu-sage italic py-2">
            No messages yet. Add a comment below to continue the conversation.
          </div>
        )}

        <div className="space-y-3">
          {request.comments.map((comment) => {
            const isOwner = comment.author_type === 'owner';
            return (
              <div
                key={comment.id}
                className={`flex gap-3 ${isOwner ? 'flex-row-reverse' : 'flex-row'}`}
              >
                {/* Avatar */}
                <div
                  className={`shrink-0 h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold ${
                    isOwner
                      ? 'bg-taksu-forest/10 text-taksu-forest'
                      : 'bg-taksu-bamboo/20 text-taksu-bamboo'
                  }`}
                >
                  {isOwner ? <User className="h-4 w-4" /> : <Building2 className="h-4 w-4" />}
                </div>

                {/* Bubble */}
                <div className={`max-w-[75%] space-y-1 ${isOwner ? 'items-end' : 'items-start'} flex flex-col`}>
                  <div
                    className={`px-4 py-3 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${
                      isOwner
                        ? 'bg-taksu-forest text-white rounded-tr-sm'
                        : 'bg-taksu-cream border border-border text-taksu-forest rounded-tl-sm'
                    }`}
                  >
                    {comment.content}
                  </div>
                  <div className={`flex items-center gap-1.5 text-[10px] text-taksu-sage ${isOwner ? 'flex-row-reverse' : ''}`}>
                    <span className="font-medium">
                      {isOwner ? (isAdmin ? 'Owner' : 'You') : 'Taksu Team'}
                    </span>
                    <span>·</span>
                    <span>{format(parseISO(comment.created_at), 'MMM d, HH:mm')}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Reply box */}
        {isClosed ? (
          <div className="rounded-lg border border-dashed border-zinc-200 p-4 text-center">
            <p className="text-sm text-taksu-sage">
              This request is {request.status} — the conversation is closed.
            </p>
          </div>
        ) : (
          <Card className="border-border">
            <CardContent className="p-4">
              <form ref={formRef} action={handleComment} className="space-y-3">
                {commentError && (
                  <div className="p-3 text-sm text-taksu-terracotta bg-taksu-terracotta/10 border border-taksu-terracotta/20 rounded-md">
                    {commentError}
                  </div>
                )}
                <Textarea
                  name="content"
                  placeholder="Add a message or follow-up…"
                  rows={3}
                  required
                  className="resize-none focus-visible:ring-taksu-jungle text-sm"
                />
                <div className="flex justify-end">
                  <Button
                    type="submit"
                    className="bg-taksu-forest hover:bg-taksu-jungle text-white"
                    disabled={isPending}
                    size="sm"
                  >
                    {isPending ? (
                      <>
                        <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                        Sending…
                      </>
                    ) : (
                      <>
                        <Send className="mr-2 h-3.5 w-3.5" />
                        Send Message
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Cancel confirm dialog */}
      <Dialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-serif text-xl text-taksu-forest">
              Cancel this request?
            </DialogTitle>
            <DialogDescription>
              This will mark the request as cancelled. You can always submit a new one.
            </DialogDescription>
          </DialogHeader>
          {cancelError && (
            <div className="p-3 text-sm text-taksu-terracotta bg-taksu-terracotta/10 border border-taksu-terracotta/20 rounded-md">
              {cancelError}
            </div>
          )}
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="outline" onClick={() => setCancelDialogOpen(false)} disabled={isCancelling}>
              Keep It
            </Button>
            <Button
              className="bg-taksu-terracotta hover:bg-taksu-terracotta/90 text-white"
              onClick={handleCancel}
              disabled={isCancelling}
            >
              {isCancelling ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Cancelling…
                </>
              ) : (
                'Yes, Cancel Request'
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
