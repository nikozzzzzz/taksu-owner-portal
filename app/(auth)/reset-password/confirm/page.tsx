import type { Metadata } from 'next';
import { UpdatePasswordForm } from '@/components/auth/update-password-form';

export const metadata: Metadata = {
  title: 'Set New Password',
};

export default function ResetPasswordConfirmPage() {
  return (
    <div className="space-y-8">
      <div className="space-y-2 text-center">
        <h1 className="font-serif text-3xl font-semibold text-taksu-forest">Set New Password</h1>
        <p className="text-sm text-taksu-sage">
          Choose a strong password for your account
        </p>
      </div>
      <UpdatePasswordForm />
    </div>
  );
}
