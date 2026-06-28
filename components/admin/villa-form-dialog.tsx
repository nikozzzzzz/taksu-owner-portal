'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface VillaFormDialogProps {
  villa: any | null;
  isOpen: boolean;
  owners: any[];
  pools: any[];
  onClose: () => void;
  onSave: (data: any) => Promise<void>;
}

export function VillaFormDialog({ villa, isOpen, owners, pools, onClose, onSave }: VillaFormDialogProps) {
  const isEditing = !!villa;
  
  const [formData, setFormData] = useState({
    id: villa?.id,
    internal_code: villa?.internal_code || '',
    display_name: villa?.display_name || '',
    villa_type: villa?.villa_type || '1br',
    bedrooms: villa?.bedrooms || 1,
    bathrooms: villa?.bathrooms || 1,
    max_guests: villa?.max_guests || 2,
    has_private_pool: villa?.has_private_pool || false,
    view_type: villa?.view_type || '',
    phase: villa?.phase || 1,
    ownership_type: villa?.ownership_type || 'investor_owned',
    owner_id: villa?.owner_id || '',
    pool_id: villa?.pool_id || '',
    
    // Physical
    square_meters: villa?.square_meters || '',
    land_area_sqm: villa?.land_area_sqm || '',
    build_year: villa?.build_year || new Date().getFullYear(),
    physical_address: villa?.physical_address || '',
    google_maps_url: villa?.google_maps_url || '',
    smart_lock_id: villa?.smart_lock_id || '',
    
    // Legal & Utilities
    cadastral_number: villa?.cadastral_number || '',
    pbg_number: villa?.pbg_number || '',
    slf_number: villa?.slf_number || '',
    slf_status: villa?.slf_status || 'not_submitted',
    slf_issue_date: villa?.slf_issue_date || '',
    slf_expiry_date: villa?.slf_expiry_date || '',
    pln_id: villa?.pln_id || '',
    pln_tariff: villa?.pln_tariff || '',
    pdam_id: villa?.pdam_id || '',
    water_source: villa?.water_source || '',
    wifi_network: villa?.wifi_network || '',
    wifi_password: villa?.wifi_password || '',
    
    // Financials & PMS
    default_management_fee_rate: villa?.default_management_fee_rate || 20,
    min_payout_threshold_usd: villa?.min_payout_threshold_usd || 0,
    owner_nights_limit_per_year: villa?.owner_nights_limit_per_year || 21,
    start_float_usd: villa?.start_float_usd || 0,
    payout_type: villa?.payout_type || 'net_profit_share',
    pricelabs_id: villa?.pricelabs_id || '',
    turno_id: villa?.turno_id || '',
    airbnb_id: villa?.airbnb_id || '',
    booking_com_id: villa?.booking_com_id || '',
  });
  
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    const payload = {
      ...formData,
      owner_id: formData.owner_id || null,
      pool_id: formData.pool_id || null,
      slf_issue_date: formData.slf_issue_date || null,
      slf_expiry_date: formData.slf_expiry_date || null,
    };
    
    await onSave(payload);
    setLoading(false);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const val = type === 'checkbox' ? (e.target as HTMLInputElement).checked : 
                (type === 'number' && value !== '' ? Number(value) : value);
                
    setFormData(prev => ({ ...prev, [name]: val }));
  };

  const InputField = ({ label, name, type = 'text', ...props }: any) => (
    <div className="space-y-2">
      <Label htmlFor={name}>{label}</Label>
      <input
        type={type}
        id={name}
        name={name}
        className="flex h-10 w-full rounded-md border border-taksu-bamboo bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-taksu-jungle"
        value={(formData as any)[name]}
        onChange={handleChange}
        {...props}
      />
    </div>
  );

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Edit Villa' : 'Create New Villa'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="pt-4">
          <Tabs defaultValue="general" className="w-full">
            <TabsList className="w-full justify-start border-b border-border bg-transparent p-0">
              <TabsTrigger value="general" className="data-[state=active]:border-b-2 data-[state=active]:border-taksu-jungle rounded-none bg-transparent">General</TabsTrigger>
              <TabsTrigger value="physical" className="data-[state=active]:border-b-2 data-[state=active]:border-taksu-jungle rounded-none bg-transparent">Physical</TabsTrigger>
              <TabsTrigger value="legal" className="data-[state=active]:border-b-2 data-[state=active]:border-taksu-jungle rounded-none bg-transparent">Legal & Utils</TabsTrigger>
              <TabsTrigger value="financial" className="data-[state=active]:border-b-2 data-[state=active]:border-taksu-jungle rounded-none bg-transparent">Financial & PMS</TabsTrigger>
            </TabsList>

            <div className="py-4">
              <TabsContent value="general" className="m-0 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <InputField label="Internal Code" name="internal_code" required />
                  <InputField label="Display Name" name="display_name" required />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="owner_id">Owner</Label>
                    <select id="owner_id" name="owner_id" className="flex h-10 w-full rounded-md border border-taksu-bamboo bg-white px-3 py-2 text-sm" value={formData.owner_id} onChange={handleChange}>
                      <option value="">-- Unassigned --</option>
                      {owners.map(o => <option key={o.id} value={o.id}>{o.full_name}</option>)}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="pool_id">Pool</Label>
                    <select id="pool_id" name="pool_id" className="flex h-10 w-full rounded-md border border-taksu-bamboo bg-white px-3 py-2 text-sm" value={formData.pool_id} onChange={handleChange}>
                      <option value="">-- No Pool --</option>
                      {pools.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="villa_type">Type</Label>
                    <select id="villa_type" name="villa_type" className="flex h-10 w-full rounded-md border border-taksu-bamboo bg-white px-3 py-2 text-sm" value={formData.villa_type} onChange={handleChange}>
                      {['studio', '1br', '2br', '3br', '1br_l', '1br_xl', '2br_l', '2br_xl', '4br'].map(t => <option key={t} value={t}>{t.toUpperCase()}</option>)}
                    </select>
                  </div>
                  <InputField label="Bedrooms" name="bedrooms" type="number" min="0" />
                  <InputField label="Bathrooms" name="bathrooms" type="number" min="0" />
                  <InputField label="Max Guests" name="max_guests" type="number" min="1" />
                  <div className="space-y-2">
                    <Label htmlFor="phase">Phase</Label>
                    <select id="phase" name="phase" className="flex h-10 w-full rounded-md border border-taksu-bamboo bg-white px-3 py-2 text-sm" value={formData.phase} onChange={handleChange}>
                      {[1,2,3,4].map(p => <option key={p} value={p}>Phase {p}</option>)}
                    </select>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="physical" className="m-0 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <InputField label="Area (sqm)" name="square_meters" type="number" />
                  <InputField label="Land Area (sqm)" name="land_area_sqm" type="number" />
                  <InputField label="Build Year" name="build_year" type="number" />
                  <InputField label="Smart Lock ID" name="smart_lock_id" />
                </div>
                <InputField label="Physical Address" name="physical_address" />
                <InputField label="Google Maps URL" name="google_maps_url" type="url" />
              </TabsContent>

              <TabsContent value="legal" className="m-0 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <InputField label="Cadastral Number" name="cadastral_number" />
                  <InputField label="PBG Number" name="pbg_number" />
                  
                  <div className="space-y-2 col-span-2 border-t pt-4 mt-2">
                    <h4 className="text-sm font-medium mb-2">SLF Certificate</h4>
                  </div>
                  <InputField label="SLF Number" name="slf_number" />
                  <div className="space-y-2">
                    <Label htmlFor="slf_status">SLF Status</Label>
                    <select id="slf_status" name="slf_status" className="flex h-10 w-full rounded-md border border-taksu-bamboo bg-white px-3 py-2 text-sm" value={formData.slf_status} onChange={handleChange}>
                      <option value="not_submitted">Not Submitted</option>
                      <option value="in_progress">In Progress</option>
                      <option value="received">Received</option>
                    </select>
                  </div>
                  <InputField label="SLF Issue Date" name="slf_issue_date" type="date" />
                  <InputField label="SLF Expiry Date" name="slf_expiry_date" type="date" />
                  
                  <div className="space-y-2 col-span-2 border-t pt-4 mt-2">
                    <h4 className="text-sm font-medium mb-2">Utilities</h4>
                  </div>
                  <InputField label="PLN ID (Electricity)" name="pln_id" />
                  <InputField label="PLN Tariff" name="pln_tariff" />
                  <InputField label="PDAM ID (Water)" name="pdam_id" />
                  <InputField label="Alternative Water Source" name="water_source" />
                  <InputField label="WiFi Network" name="wifi_network" />
                  <InputField label="WiFi Password" name="wifi_password" />
                </div>
              </TabsContent>

              <TabsContent value="financial" className="m-0 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2 col-span-2">
                    <h4 className="text-sm font-medium mb-2">Financial Terms</h4>
                  </div>
                  <InputField label="Management Fee (%)" name="default_management_fee_rate" type="number" />
                  <div className="space-y-2">
                    <Label htmlFor="payout_type">Payout Type</Label>
                    <select id="payout_type" name="payout_type" className="flex h-10 w-full rounded-md border border-taksu-bamboo bg-white px-3 py-2 text-sm" value={formData.payout_type} onChange={handleChange}>
                      <option value="net_profit_share">Net Profit Share</option>
                      <option value="gross">Gross</option>
                    </select>
                  </div>
                  <InputField label="Min Payout Threshold (USD)" name="min_payout_threshold_usd" type="number" />
                  <InputField label="Owner Nights Limit/Yr" name="owner_nights_limit_per_year" type="number" />
                  <InputField label="Start Float (USD)" name="start_float_usd" type="number" />
                  
                  <div className="space-y-2 col-span-2 border-t pt-4 mt-2">
                    <h4 className="text-sm font-medium mb-2">PMS Integrations</h4>
                  </div>
                  <InputField label="PriceLabs ID" name="pricelabs_id" />
                  <InputField label="Turno ID" name="turno_id" />
                  <InputField label="Airbnb ID" name="airbnb_id" />
                  <InputField label="Booking.com ID" name="booking_com_id" />
                </div>
              </TabsContent>
            </div>
          </Tabs>

          <DialogFooter className="mt-6 border-t pt-4">
            <Button variant="outline" type="button" onClick={onClose} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Saving...' : 'Save Villa'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
