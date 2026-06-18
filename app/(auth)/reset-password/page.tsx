import type { Metadata } from 'next';
import Link from 'next/link';
import { ResetPasswordForm } from '@/components/auth/reset-password-form';

export const metadata: Metadata = {
  title: 'Reset Password',
  description: 'Reset your Taksu Living Owner Portal password',
};

export default function ResetPasswordPage() {
  return (
    <div className="space-y-8">
      <div className="space-y-2 text-center">
        <h1 className="font-serif text-3xl font-semibold text-taksu-forest">Reset Password</h1>
        <p className="text-sm text-taksu-sage">
          Enter your email and we&apos;ll send you a link to reset your password
        </p>
      </div>

      <ResetPasswordForm />

      <p className="text-center text-sm text-taksu-sage">
        Remember your password?{' '}
        <Link href="/login" className="text-taksu-jungle underline-offset-4 hover:underline">
          Back to sign in
        </Link>
      </p>
    </div>
  );
}
