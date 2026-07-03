'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export function VillaSelector({ villas, selectedId }: { villas: any[], selectedId: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const handleSelect = (id: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('villaId', id);
    router.push(`?${params.toString()}`);
  };

  return (
    <Select value={selectedId} onValueChange={handleSelect}>
      <SelectTrigger className="w-[200px] border-none bg-transparent h-8 shadow-none focus:ring-0">
        <SelectValue placeholder="Select Property" />
      </SelectTrigger>
      <SelectContent>
        {villas.map(villa => (
          <SelectItem key={villa.id} value={villa.id}>
            {villa.display_name} ({villa.internal_code})
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
