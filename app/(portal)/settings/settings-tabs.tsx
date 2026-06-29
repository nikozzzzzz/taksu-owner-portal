'use client';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ProfileForm } from './profile-form';
import { TaxForm } from './tax-form';
import { PreferencesForm } from './preferences-form';
import { BankingForm } from './banking-form';

interface SettingsTabsProps {
  owner: any; // We'll just pass the owner object down
}

export function SettingsTabs({ owner }: SettingsTabsProps) {
  return (
    <Tabs defaultValue="profile" className="w-full">
      <div className="border-b border-border px-6 pt-4 bg-taksu-cream/50">
        <TabsList className="bg-transparent space-x-6 pb-0">
          <TabsTrigger
            value="profile"
            className="data-[state=active]:border-b-2 data-[state=active]:border-taksu-jungle data-[state=active]:bg-transparent data-[state=active]:shadow-none rounded-none px-1 pb-3 pt-2 text-sm font-medium"
          >
            Personal Information
          </TabsTrigger>
          <TabsTrigger
            value="tax"
            className="data-[state=active]:border-b-2 data-[state=active]:border-taksu-jungle data-[state=active]:bg-transparent data-[state=active]:shadow-none rounded-none px-1 pb-3 pt-2 text-sm font-medium"
          >
            Tax Profile
          </TabsTrigger>
          <TabsTrigger
            value="preferences"
            className="data-[state=active]:border-b-2 data-[state=active]:border-taksu-jungle data-[state=active]:bg-transparent data-[state=active]:shadow-none rounded-none px-1 pb-3 pt-2 text-sm font-medium"
          >
            Preferences
          </TabsTrigger>
          <TabsTrigger
            value="banking"
            className="data-[state=active]:border-b-2 data-[state=active]:border-taksu-jungle data-[state=active]:bg-transparent data-[state=active]:shadow-none rounded-none px-1 pb-3 pt-2 text-sm font-medium"
          >
            Banking & Payout
          </TabsTrigger>
        </TabsList>
      </div>

      <div className="p-6 md:p-8">
        <TabsContent value="profile" className="m-0 focus-visible:outline-none">
          <div className="max-w-2xl">
            <h2 className="text-lg font-medium text-taksu-forest mb-6">Personal Details</h2>
            <ProfileForm owner={owner} />
          </div>
        </TabsContent>

        <TabsContent value="tax" className="m-0 focus-visible:outline-none">
          <div className="max-w-2xl">
            <h2 className="text-lg font-medium text-taksu-forest mb-6">Tax Profile</h2>
            <TaxForm owner={owner} />
          </div>
        </TabsContent>

        <TabsContent value="preferences" className="m-0 focus-visible:outline-none">
          <div className="max-w-2xl">
            <h2 className="text-lg font-medium text-taksu-forest mb-6">Communication Preferences</h2>
            <PreferencesForm owner={owner} />
          </div>
        </TabsContent>

        <TabsContent value="banking" className="m-0 focus-visible:outline-none">
          <div className="max-w-2xl">
            <div className="mb-6">
              <h2 className="text-lg font-medium text-taksu-forest">Banking Information</h2>
              <p className="text-sm text-taksu-sage mt-1">
                Updating these details requires confirming your password for security.
              </p>
            </div>
            <BankingForm owner={owner} />
          </div>
        </TabsContent>
      </div>
    </Tabs>
  );
}
