import type { Metadata } from 'next';
import Link from 'next/link';
import { LoginForm } from '@/components/auth/login-form';

export const metadata: Metadata = {
  title: 'Sign In',
  description: 'Sign in to your Taksu Living Owner Portal',
};

export default function LoginPage() {
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
        <h1 className="font-serif text-3xl font-semibold text-taksu-forest">Welcome back</h1>
        <p className="text-sm text-taksu-sage">
          Sign in to access your villa performance and statements
        </p>
      </div>

      {/* Form */}
      <LoginForm />

      {/* Footer */}
      <p className="text-center text-xs text-taksu-sage">
        Need help?{' '}
        <a
          href="mailto:support@taksuliving.com"
          className="text-taksu-jungle underline-offset-4 hover:underline"
        >
          Contact your property manager
        </a>
      </p>

      <div className="text-center text-sm">
        <span className="text-taksu-sage">Don't have an account? </span>
        <Link
          href="/signup"
          className="font-medium text-taksu-jungle underline-offset-4 hover:underline"
        >
          Sign up
        </Link>
      </div>
    </div>
  );
}
