import type { Metadata } from 'next';
import { SignupForm } from '@/components/auth/signup-form';

export const metadata: Metadata = {
  title: 'Sign Up',
  description: 'Register for your Taksu Living Owner Portal account',
};

export default function SignupPage() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="space-y-2 text-center">
        <div className="flex justify-center lg:hidden">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-taksu-jungle">
              <span className="font-serif text-lg font-bold text-white">TL</span>
            </div>
          </div>
        </div>
        <h1 className="font-serif text-3xl font-semibold text-taksu-forest">Create Account</h1>
        <p className="text-sm text-taksu-sage">
          Register to access your villa performance and statements
        </p>
      </div>

      {/* Form */}
      <SignupForm />
    </div>
  );
}
