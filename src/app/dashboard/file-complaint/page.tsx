'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { addDoc, collection, serverTimestamp, GeoPoint, query, where, getDocs } from 'firebase/firestore';
import { Loader2, Send, ShieldAlert, User, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { db } from '@/lib/firebase';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useAuth } from '@/hooks/use-auth';
import { Incident, UserProfile } from '@/types';
import { classifyIncidentType } from '@/ai/flows/classify-incident-type';

const formSchema = z.object({
  targetStudentId: z.string().min(1, { message: 'Please enter the ID of the student you are reporting.' }),
  description: z.string().min(20, { message: 'Please provide a detailed description of the incident (min. 20 characters).' }),
});

export default function FileComplaintPage() {
  const { toast } = useToast();
  const { user, userProfile } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      targetStudentId: '',
      description: '',
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!user || !userProfile) {
      toast({ variant: 'destructive', title: 'Authentication Error', description: 'You must be logged in to file a complaint.' });
      return;
    }

    setIsLoading(true);
    try {
        // Fetch the target student's name for a more complete report
        let targetStudentName = 'N/A';
        const q = query(collection(db, 'users'), where('uid', '==', values.targetStudentId));
        const querySnapshot = await getDocs(q);
        if (!querySnapshot.empty) {
            const targetUserData = querySnapshot.docs[0].data() as UserProfile;
            targetStudentName = targetUserData.name;
        } else {
             toast({ variant: 'destructive', title: 'Student Not Found', description: `No student found with ID: ${values.targetStudentId}`});
             setIsLoading(false);
             return;
        }

      const classification = await classifyIncidentType({ audioTranscript: values.description });

      const newIncident: Omit<Incident, 'id'> = {
        timestamp: serverTimestamp() as any,
        type: classification.incidentType,
        audioTranscript: values.description,
        location: new GeoPoint(0, 0), // Location not applicable for student-filed complaints
        status: 'reported',
        reporterId: user.uid,
        reporterName: userProfile.name,
        targetStudentId: values.targetStudentId,
        targetStudentName: targetStudentName
      };

      await addDoc(collection(db, 'incidents'), newIncident);

      toast({
        title: 'Complaint Filed Successfully',
        description: 'Your report has been submitted for review. You can track its status on your dashboard.',
      });
      form.reset();
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Submission Failed',
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
            <ShieldAlert className="h-10 w-10 text-destructive" />
            <div>
              <CardTitle className="font-headline text-3xl">File a Confidential Complaint</CardTitle>
              <CardDescription>Your report will be sent directly to the administration for review.</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-6">
              <FormField
                control={form.control}
                name="targetStudentId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2"><User /> Student ID to Report</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter the 28-character student UID" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2"><FileText /> Detailed Description</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Describe the incident in detail. Include date, time, location, and what happened." {...field} className="min-h-[200px]" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full justify-center" disabled={isLoading}>
                {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
                Submit Secure Report
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}

    