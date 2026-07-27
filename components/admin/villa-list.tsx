'use client';

import { useState } from 'react';
import { Edit2, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { upsertVilla } from '@/lib/actions/admin-actions';
import { VillaFormDialog } from './villa-form-dialog';

interface VillaListProps {
  initialVillas: any[];
  owners: any[];
  pools: any[];
}

export function VillaList({ initialVillas, owners, pools }: VillaListProps) {
  const [villas, setVillas] = useState(initialVillas);
  const [editingVilla, setEditingVilla] = useState<any | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  const handleSave = async (data: any) => {
    try {
      await upsertVilla(data);
      // Let server revalidation handle the full update
      window.location.reload(); 
    } catch (err: any) {
      alert(err.message || 'Failed to save villa');
    }
  };

  return (
    <Card className="overflow-hidden">
      <div className="flex justify-between items-center p-4 border-b border-taksu-bamboo/30 bg-taksu-cream/50">
        <h3 className="font-semibold text-taksu-forest">Properties</h3>
        <Button size="sm" onClick={() => setIsCreating(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Villa
        </Button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm text-taksu-sage">
          <thead className="bg-taksu-cream text-xs uppercase text-taksu-forest">
            <tr>
              <th className="px-6 py-4 font-medium">Code</th>
              <th className="px-6 py-4 font-medium">Name</th>
              <th className="px-6 py-4 font-medium">Owner</th>
              <th className="px-6 py-4 font-medium">Pool</th>
              <th className="px-6 py-4 font-medium">Integration</th>
              <th className="px-6 py-4 font-medium">Bedrooms</th>
              <th className="px-6 py-4 text-right font-medium">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-taksu-bamboo/20 bg-white">
            {villas.map((villa) => (
              <tr key={villa.id} className="hover:bg-taksu-cream/50">
                <td className="px-6 py-4 font-medium text-taksu-forest">
                  {villa.internal_code}
                </td>
                <td className="px-6 py-4">{villa.display_name}</td>
                <td className="px-6 py-4">
                  {villa.owner ? villa.owner.full_name : <span className="text-taksu-sage/50 italic">Unassigned</span>}
                </td>
                <td className="px-6 py-4">
                  {villa.pool ? <Badge variant="outline">{villa.pool.name}</Badge> : '-'}
                </td>
                <td className="px-6 py-4">
                  <div className="flex flex-col gap-1 items-start">
                    {villa.beds24_property_id ? (
                      <Badge variant="secondary" className="bg-blue-100 text-blue-700 hover:bg-blue-200 border-none">Beds24</Badge>
                    ) : villa.hostaway_listing_id ? (
                      <Badge variant="secondary" className="bg-purple-100 text-purple-700 hover:bg-purple-200 border-none">Hostaway</Badge>
                    ) : (
                      <span className="text-taksu-sage/50 text-xs italic">None</span>
                    )}
                    {villa.last_synced_at && (
                      <span className="text-[10px] text-taksu-sage/60 whitespace-nowrap">
                        {new Date(villa.last_synced_at).toLocaleString(undefined, { 
                          month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' 
                        })}
                      </span>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4">{villa.bedrooms || 0} BR</td>
                <td className="px-6 py-4 text-right">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setEditingVilla(villa)}
                  >
                    <Edit2 className="h-4 w-4 mr-2" />
                    Edit
                  </Button>
                </td>
              </tr>
            ))}
            {villas.length === 0 && (
              <tr>
                <td colSpan={6} className="px-6 py-8 text-center text-taksu-sage">
                  No villas found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {(editingVilla || isCreating) && (
        <VillaFormDialog
          villa={editingVilla}
          isOpen={true}
          owners={owners}
          pools={pools}
          onClose={() => {
            setEditingVilla(null);
            setIsCreating(false);
          }}
          onSave={handleSave}
        />
      )}
    </Card>
  );
}
