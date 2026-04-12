import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { sendEmailLink } from '@/firebase/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';

const schema = z.object({
  email: z.string().email('Enter a valid email address'),
});

export default function Login() {
  const [sent, setSent] = useState(false);

  const form = useForm({
    resolver: zodResolver(schema),
    defaultValues: { email: '' },
  });

  async function onSubmit(values) {
    try {
      await sendEmailLink(values.email, null);
      setSent(true);
    } catch (err) {
      toast.error('Could not send the link. Please try again.');
      console.error(err);
    }
  }

  return (
    <main className="max-w-sm mx-auto px-4 py-16">
      <div className="mb-8">
        <Button variant="ghost" asChild className="-ml-2 mb-4 text-muted-foreground">
          <Link to="/">← Back to gallery</Link>
        </Button>
        <h1 className="text-3xl font-bold mb-1">Sign in</h1>
        <p className="text-muted-foreground text-sm">
          Track and manage your submissions.
        </p>
      </div>

      {sent ? (
        <div className="flex flex-col gap-4">
          <p className="text-sm">
            We've sent a sign-in link to <strong>{form.getValues('email')}</strong>.
            Click it to sign in — no password needed.
          </p>
          <p className="text-xs text-muted-foreground">
            The link works on any device. You can close this page.
          </p>
          <Button variant="outline" asChild className="w-full">
            <Link to="/">Back to gallery</Link>
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
                    <Input type="email" autoComplete="email" placeholder="you@example.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" disabled={form.formState.isSubmitting} className="w-full">
              {form.formState.isSubmitting ? 'Sending…' : 'Send sign-in link'}
            </Button>
          </form>
        </Form>
      )}
    </main>
  );
}
