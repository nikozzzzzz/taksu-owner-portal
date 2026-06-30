'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { createClientSupabaseClient } from '@/lib/supabase/client';

export function SignupForm() {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<boolean>(false);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    if (!fullName) {
      setError('Please enter your full name.');
      return;
    }
    if (!email || !email.includes('@')) {
      setError('Please enter a valid email address.');
      return;
    }
    if (!password || password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    startTransition(async () => {
      const supabase = createClientSupabaseClient();
      const { error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
          },
        },
      });

      if (authError) {
        let errorMessage = authError.message;
        
        // Handle case where Supabase returns an empty JSON object string for certain 500 errors
        if (errorMessage === '{}' || errorMessage === '[object Object]') {
          errorMessage = (authError as any).msg || 'An unexpected error occurred during signup.';
        }
        
        // Fallback for non-string messages
        if (!errorMessage || typeof errorMessage !== 'string') {
          errorMessage = 'An unexpected error occurred. Please try again later.';
        }

        // Provide a friendly error for rate limits (which happens often on test environments)
        if (errorMessage.includes('Error sending confirmation email') || errorMessage.includes('rate limit')) {
          errorMessage = 'We are unable to send the confirmation email at this time due to high volume. Please try again later.';
        }

        setError(errorMessage);
        return;
      }

      // If email confirmation is required, Supabase auth.signUp returns data without a session
      // In this setup, we assume email verification is enabled by default.
      setSuccess(true);
    });
  };

  if (success) {
    return (
      <div className="space-y-6 text-center">
        <div className="rounded-lg border border-taksu-bamboo bg-white p-8">
          <h2 className="mb-2 text-xl font-semibold text-taksu-forest">Check your email</h2>
          <p className="mb-6 text-sm text-taksu-sage">
            We've sent a verification link to <span className="font-medium text-taksu-forest">{email}</span>. 
            Please check your inbox and click the link to activate your account.
          </p>
          <Link href="/login">
            <Button className="w-full bg-taksu-jungle hover:bg-taksu-forest text-white">
              Return to Login
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
      {/* Error message */}
      {error && (
        <div
          role="alert"
          className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
        >
          {error}
        </div>
      )}

      {/* Full Name */}
      <div className="space-y-1.5">
        <Label htmlFor="signup-fullname">Full Name</Label>
        <Input
          id="signup-fullname"
          type="text"
          autoComplete="name"
          placeholder="John Doe"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          disabled={isPending}
          required
        />
      </div>

      {/* Email */}
      <div className="space-y-1.5">
        <Label htmlFor="signup-email">Email address</Label>
        <Input
          id="signup-email"
          type="email"
          autoComplete="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={isPending}
          required
        />
      </div>

      {/* Password */}
      <div className="space-y-1.5">
        <Label htmlFor="signup-password">Password</Label>
        <Input
          id="signup-password"
          type="password"
          autoComplete="new-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          disabled={isPending}
          required
        />
      </div>

      {/* Confirm Password */}
      <div className="space-y-1.5">
        <Label htmlFor="signup-confirm-password">Confirm Password</Label>
        <Input
          id="signup-confirm-password"
          type="password"
          autoComplete="new-password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          disabled={isPending}
          required
        />
      </div>

      <Button
        type="submit"
        className="w-full bg-taksu-jungle hover:bg-taksu-forest text-white"
        disabled={isPending}
      >
        {isPending ? 'Creating Account...' : 'Sign up'}
      </Button>

      <div className="text-center text-sm mt-4">
        <span className="text-taksu-sage">Already have an account? </span>
        <Link
          href="/login"
          className="font-medium text-taksu-jungle underline-offset-4 hover:underline"
        >
          Log in
        </Link>
      </div>
    </form>
  );
}
