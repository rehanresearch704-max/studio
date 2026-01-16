'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { doc, updateDoc } from 'firebase/firestore';
import { Loader2, Clock, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { db } from '@/lib/firebase';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useAuth } from '@/hooks/use-auth';

const formSchema = z.object({
  availability: z.string().min(10, { message: 'Please describe your availability (min. 10 characters).' }),
});

export default function SetAvailabilityPage() {
  const { toast } = useToast();
  const { user, userProfile } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      availability: '',
    },
  });

  useEffect(() => {
    if (userProfile?.availability) {
      form.setValue('availability', userProfile.availability);
    }
  }, [userProfile, form]);

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!user) {
      toast({ variant: 'destructive', title: 'Authentication Error', description: 'You must be logged in.' });
      return;
    }

    setIsLoading(true);
    try {
      const userDocRef = doc(db, 'users', user.uid);
      await updateDoc(userDocRef, {
        availability: values.availability,
      });

      toast({
        title: 'Availability Updated',
        description: 'Your availability has been saved successfully.',
      });
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Update Failed',
        description: error.message || 'An unexpected error occurred. Please try again.',
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="w-full max-w-3xl mx-auto">
      <Card className="shadow-lg">
        <CardHeader>
          <div className="flex items-center gap-4">
            <Clock className="h-10 w-10 text-primary" />
            <div>
              <CardTitle className="font-headline text-3xl">Set Your Availability</CardTitle>
              <CardDescription>Let students know when you are available for sessions.</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-6">
              <FormField
                control={form.control}
                name="availability"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Availability Notes</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="e.g., 'Available on Mondays & Wednesdays from 10 AM to 12 PM. Please book at least 24 hours in advance.'"
                        {...field}
                        className="min-h-[150px]"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full justify-center" disabled={isLoading}>
                {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                Save Availability
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
