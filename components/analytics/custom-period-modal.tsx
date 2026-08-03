'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';

interface CustomPeriodModalProps {
  currentPeriod: string;
}

export function CustomPeriodModal({ currentPeriod }: CustomPeriodModalProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [open, setOpen] = useState(false);
  
  // Try to parse existing custom period
  let initialStart = '';
  let initialEnd = '';
  
  if (currentPeriod.includes('_')) {
    const [start, end] = currentPeriod.split('_');
    initialStart = start;
    initialEnd = end;
  } else {
    // Default to this year
    const year = new Date().getFullYear();
    initialStart = `${year}-01`;
    initialEnd = `${year}-12`;
  }

  const [startMonth, setStartMonth] = useState(initialStart);
  const [endMonth, setEndMonth] = useState(initialEnd);

  const handleApply = () => {
    if (!startMonth || !endMonth) return;
    
    const params = new URLSearchParams(searchParams.toString());
    params.set('period', `${startMonth}_${endMonth}`);
    
    setOpen(false);
    router.push(`?${params.toString()}`);
  };

  const isCustom = currentPeriod.includes('_');

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button
          className={`px-3 py-1.5 text-sm font-medium rounded-sm transition-colors ${
            isCustom
              ? 'bg-taksu-parchment text-taksu-forest'
              : 'text-taksu-sage hover:text-taksu-forest'
          }`}
        >
          Custom
        </button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Select Custom Period</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="start-month" className="text-right">
              Start
            </Label>
            <input
              id="start-month"
              type="month"
              value={startMonth}
              onChange={(e) => setStartMonth(e.target.value)}
              className="col-span-3 flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="end-month" className="text-right">
              End
            </Label>
            <input
              id="end-month"
              type="month"
              value={endMonth}
              onChange={(e) => setEndMonth(e.target.value)}
              className="col-span-3 flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleApply}>Apply</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
