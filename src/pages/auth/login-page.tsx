import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useLocation, useNavigate } from 'react-router-dom';
import { FormError } from '../../components/ui/form-error';
import { getDefaultRouteForRole } from '../../features/auth/route-utils';
import { useAuth } from '../../features/auth/use-auth';
import { loginSchema, type LoginValues } from '../../lib/schemas/auth';
import { getErrorMessage } from '../../lib/utils/error';

export function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { signIn, profile, session } = useAuth();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const form = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  useEffect(() => {
    if (session && profile) {
      const from = location.state?.from;
      navigate(from || getDefaultRouteForRole(profile.role), { replace: true });
    }
  }, [location.state, navigate, profile, session]);

  async function onSubmit(values: LoginValues) {
    setErrorMessage(null);

    try {
      await signIn(values.email, values.password);
    } catch (error) {
      setErrorMessage(getErrorMessage(error, 'Unable to sign in.'));
    }
  }

  return (
    <div className="page-shell flex min-h-screen items-center justify-center p-6">
      <div className="glass-panel w-full max-w-md p-8">
        <p className="text-xs uppercase tracking-[0.3em] text-amber-700">Staff Auth</p>
        <h1 className="mt-3 text-3xl font-semibold text-slate-900">Login</h1>
        <p className="mt-3 text-sm leading-6 text-slate-600">
          This sign-in is for restaurant staff only. Customer ordering remains public through secure QR links.
        </p>
        <form className="mt-6 space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
          <div>
            <input
              {...form.register('email')}
              className="w-full rounded-2xl border border-slate-200 px-4 py-3"
              placeholder="Email address"
              type="email"
            />
            <FormError message={form.formState.errors.email?.message} />
          </div>
          <div>
            <input
              {...form.register('password')}
              className="w-full rounded-2xl border border-slate-200 px-4 py-3"
              type="password"
              placeholder="Password"
            />
            <FormError message={form.formState.errors.password?.message} />
          </div>
          {errorMessage ? <p className="text-sm leading-6 text-rose-600">{errorMessage}</p> : null}
          <button
            className="w-full rounded-full bg-slate-900 px-5 py-3 text-sm font-medium text-white disabled:opacity-60"
            disabled={form.formState.isSubmitting}
            type="submit"
          >
            {form.formState.isSubmitting ? 'Signing in...' : 'Sign in'}
          </button>
        </form>
        <div className="mt-6 rounded-2xl bg-amber-50 p-4 text-sm leading-6 text-amber-900">
          Staff accounts need a Supabase Auth user and a matching row in `public.profiles`. This project now includes a
          `manage-staff` edge function so admins can create additional staff inside the app after bootstrap.
        </div>
      </div>
    </div>
  );
}
