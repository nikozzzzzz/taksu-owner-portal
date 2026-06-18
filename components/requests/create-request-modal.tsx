'use client';

import { useState } from 'react';
import { Plus, Loader2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { submitRequest } from '@/lib/actions/request-actions';

export function CreateRequestModal() {
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
        setOpen(false);
      }
    } catch (err) {
      setError('An unexpected error occurred.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-taksu-forest hover:bg-taksu-jungle text-white">
          <Plus className="mr-2 h-4 w-4" />
          New Request
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-serif text-2xl text-taksu-forest">Submit a Request</DialogTitle>
          <DialogDescription>
            Send a message to the Taksu Management team. We typically respond within 24 hours.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5 py-4">
          {error && (
            <div className="p-3 text-sm text-taksu-terracotta bg-taksu-terracotta/10 border border-taksu-terracotta/20 rounded-md">
              {error}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="category" className="text-taksu-forest">Category</Label>
            <Select name="category" required defaultValue="general_inquiry">
              <SelectTrigger id="category" className="focus:ring-taksu-jungle">
                <SelectValue placeholder="Select a category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="personal_stay">Personal Stay Reservation</SelectItem>
                <SelectItem value="maintenance_request">Maintenance Report</SelectItem>
                <SelectItem value="financial_inquiry">Financial/Statement Inquiry</SelectItem>
                <SelectItem value="general_inquiry">General Question</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="subject" className="text-taksu-forest">Subject</Label>
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

          <div className="space-y-2">
            <Label htmlFor="description" className="text-taksu-forest">Description</Label>
            <Textarea 
              id="description" 
              name="description" 
              placeholder="Please provide as much detail as possible..." 
              required 
              minLength={10}
              rows={5}
              className="resize-none focus-visible:ring-taksu-jungle"
            />
            <p className="text-xs text-taksu-sage">
              For personal stays, please specify your exact check-in and check-out dates.
            </p>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-border">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" className="bg-taksu-forest hover:bg-taksu-jungle" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sending...
                </>
              ) : (
                'Submit Request'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
