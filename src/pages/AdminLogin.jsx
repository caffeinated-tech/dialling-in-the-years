import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '@/hooks/useAuth';
import { sendEmailLink } from '@/firebase/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';

const schema = z.object({
  email: z.string().email('Enter a valid email address'),
});

export default function AdminLogin() {
  const navigate = useNavigate();
  const { user, isAdmin, loading } = useAuth();
  const [sent, setSent] = useState(false);
  const [sentTo, setSentTo] = useState('');

  // Redirect if already signed in as admin
  useEffect(() => {
    if (!loading && user && isAdmin) navigate('/admin', { replace: true });
  }, [user, isAdmin, loading, navigate]);

  const form = useForm({
    resolver: zodResolver(schema),
    defaultValues: { email: '' },
  });

  async function onSubmit(values) {
    try {
      // No anonymousUid — this is a plain admin sign-in, not account linking
      await sendEmailLink(values.email, null);
      setSentTo(values.email);
      setSent(true);
    } catch {
      form.setError('root', { message: 'Could not send the link. Please try again.' });
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold mb-1">Admin sign-in</h1>
          <p className="text-muted-foreground text-sm">Phoning in the Years — curator panel</p>
        </div>

        {sent ? (
          <div className="text-center flex flex-col gap-4">
            <p className="text-sm text-muted-foreground">
              A sign-in link has been sent to <strong className="text-foreground">{sentTo}</strong>.
              Click the link in your email to continue.
            </p>
            <Button variant="ghost" className="text-muted-foreground text-sm" onClick={() => setSent(false)}>
              Use a different email
            </Button>
          </div>
        ) : (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input type="email" autoComplete="email" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {form.formState.errors.root && (
                <p className="text-destructive text-sm">{form.formState.errors.root.message}</p>
              )}

              <Button type="submit" disabled={form.formState.isSubmitting} className="w-full">
                {form.formState.isSubmitting ? 'Sending…' : 'Send sign-in link'}
              </Button>
            </form>
          </Form>
        )}
      </div>
    </main>
  );
}
