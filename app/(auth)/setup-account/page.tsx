import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Setup Account',
  description: 'Set up your Taksu Living Owner Portal account',
};

export default function SetupAccountPage() {
  return (
    <div className="space-y-8">
      <div className="space-y-2 text-center">
        <h1 className="font-serif text-3xl font-semibold text-taksu-forest">Welcome to Taksu Living</h1>
        <p className="text-sm text-taksu-sage">
          Please set up your password to access your Owner Portal
        </p>
      </div>

      <div className="rounded-lg border border-border bg-card p-6 text-center">
        <p className="text-sm text-taksu-sage">
          Account setup form will be implemented in Phase 2 (Authentication).
        </p>
        <Link href="/login" className="mt-4 inline-block text-sm text-taksu-jungle hover:underline">
          Back to sign in
        </Link>
      </div>
    </div>
  );
}
