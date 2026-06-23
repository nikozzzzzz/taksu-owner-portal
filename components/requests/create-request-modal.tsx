'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Loader2, CalendarDays } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { submitRequest } from '@/lib/actions/request-actions';

const CATEGORIES = [
  { value: 'general', label: 'General Question' },
  { value: 'maintenance_request', label: 'Maintenance Report' },
  { value: 'personal_stay', label: 'Personal Stay Reservation' },
  { value: 'financial_inquiry', label: 'Financial / Statement Inquiry' },
  { value: 'payout_inquiry', label: 'Payout Inquiry' },
  { value: 'amenity_addition', label: 'Amenity Addition Request' },
  { value: 'pricing_inquiry', label: 'Pricing Inquiry' },
  { value: 'document_request', label: 'Document Request' },
  { value: 'contract_inquiry', label: 'Contract Inquiry' },
] as const;

export function CreateRequestModal() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('general');

  const isPersonalStay = selectedCategory === 'personal_stay';

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    const formData = new FormData(e.currentTarget);

    try {
      const result = await submitRequest(formData);

      if (result.error) {
        setError(result.error);
      } else if (result.success) {
        setSuccess(true);
        setTimeout(() => {
          setOpen(false);
          setSuccess(false);
          setSelectedCategory('general');
          if (result.id) {
            router.push(`/requests/${result.id}`);
          } else {
            router.refresh();
          }
        }, 1200);
      }
    } catch {
      setError('An unexpected error occurred.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenChange = (v: boolean) => {
    if (!isSubmitting) {
      setOpen(v);
      if (!v) {
        setError(null);
        setSuccess(false);
        setSelectedCategory('general');
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button className="bg-taksu-forest hover:bg-taksu-jungle text-white">
          <Plus className="mr-2 h-4 w-4" />
          New Request
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-serif text-2xl text-taksu-forest">
            Submit a Request
          </DialogTitle>
          <DialogDescription>
            Send a message to the Taksu Management team. We typically respond within 24 hours.
          </DialogDescription>
        </DialogHeader>

        {success ? (
          <div className="py-8 flex flex-col items-center gap-3 text-center">
            <div className="h-12 w-12 rounded-full bg-taksu-jungle/10 flex items-center justify-center">
              <svg className="h-6 w-6 text-taksu-jungle" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <p className="font-medium text-taksu-forest">Request submitted!</p>
            <p className="text-sm text-taksu-sage">Redirecting to your request…</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5 py-4">
            {error && (
              <div className="p-3 text-sm text-taksu-terracotta bg-taksu-terracotta/10 border border-taksu-terracotta/20 rounded-md">
                {error}
              </div>
            )}

            {/* Category */}
            <div className="space-y-2">
              <Label htmlFor="category" className="text-taksu-forest">
                Category
              </Label>
              <Select
                name="category"
                required
                value={selectedCategory}
                onValueChange={setSelectedCategory}
              >
                <SelectTrigger id="category" className="focus:ring-taksu-jungle">
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((cat) => (
                    <SelectItem key={cat.value} value={cat.value}>
                      {cat.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Personal stay dates (conditional) */}
            {isPersonalStay && (
              <div className="grid grid-cols-2 gap-3 p-3 rounded-lg bg-taksu-cream/50 border border-taksu-parchment">
                <div className="col-span-2 flex items-center gap-2 text-xs text-taksu-sage mb-1">
                  <CalendarDays className="h-3.5 w-3.5" />
                  Preferred dates for your stay
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="preferred_dates_start" className="text-xs text-taksu-forest">
                    Check-in
                  </Label>
                  <Input
                    id="preferred_dates_start"
                    name="preferred_dates_start"
                    type="date"
                    className="focus-visible:ring-taksu-jungle text-sm"
                    min={new Date().toISOString().split('T')[0]}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="preferred_dates_end" className="text-xs text-taksu-forest">
                    Check-out
                  </Label>
                  <Input
                    id="preferred_dates_end"
                    name="preferred_dates_end"
                    type="date"
                    className="focus-visible:ring-taksu-jungle text-sm"
                    min={new Date().toISOString().split('T')[0]}
                  />
                </div>
              </div>
            )}

            {/* Subject */}
            <div className="space-y-2">
              <Label htmlFor="subject" className="text-taksu-forest">
                Subject
              </Label>
              <Input
                id="subject"
                name="subject"
                placeholder="Brief summary of your request"
                required
                minLength={5}
                maxLength={100}
                className="focus-visible:ring-taksu-jungle"
              />
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description" className="text-taksu-forest">
                Description
              </Label>
              <Textarea
                id="description"
                name="description"
                placeholder="Please provide as much detail as possible…"
                required
                minLength={10}
                rows={4}
                className="resize-none focus-visible:ring-taksu-jungle"
              />
              {isPersonalStay && (
                <p className="text-xs text-taksu-sage">
                  Please confirm your exact check-in and check-out dates above and any special requirements.
                </p>
              )}
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-border">
              <Button type="button" variant="outline" onClick={() => handleOpenChange(false)}>
                Cancel
              </Button>
              <Button
                type="submit"
                className="bg-taksu-forest hover:bg-taksu-jungle"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Sending…
                  </>
                ) : (
                  'Submit Request'
                )}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
