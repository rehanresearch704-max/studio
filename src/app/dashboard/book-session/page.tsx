'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { addDoc, collection, serverTimestamp, query, where, getDocs } from 'firebase/firestore';
import { Loader2, Send, CalendarCheck, User, FileText } from 'lucide-react';
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
import { Appointment, UserProfile } from '@/types';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const formSchema = z.object({
  staffId: z.string().min(1, { message: 'Please select a faculty member.' }),
  type: z.enum(['Academic Guidance', 'Grievance Redressal', 'Mentorship']),
  notes: z.string().min(10, { message: 'Please provide a brief reason for your appointment (min. 10 characters).' }),
});

export default function BookSessionPage() {
  const { toast } = useToast();
  const { user, userProfile } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [faculty, setFaculty] = useState<UserProfile[]>([]);
  
  useEffect(() => {
      const fetchFaculty = async () => {
          const q = query(collection(db, 'users'), where('role', '==', 'faculty'));
          const querySnapshot = await getDocs(q);
          const facultyList = querySnapshot.docs.map(doc => doc.data() as UserProfile);
          setFaculty(facultyList);
      }
      fetchFaculty();
  }, [])

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      staffId: '',
      type: 'Academic Guidance',
      notes: '',
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!user || !userProfile) {
      toast({ variant: 'destructive', title: 'Authentication Error', description: 'You must be logged in to book a session.' });
      return;
    }

    setIsLoading(true);
    try {
      const selectedFaculty = faculty.find(f => f.uid === values.staffId);
      if(!selectedFaculty) {
        toast({ variant: 'destructive', title: 'Faculty not found', description: 'Selected faculty could not be found.' });
        setIsLoading(false);
        return;
      }

      const newAppointment: Omit<Appointment, 'id' | 'time'> = {
        studentId: user.uid,
        studentName: userProfile.name,
        staffId: values.staffId,
        staffName: selectedFaculty.name,
        type: values.type,
        status: 'pending',
        notes: values.notes,
      };

      await addDoc(collection(db, 'appointments'), {
        ...newAppointment,
        time: serverTimestamp(),
      });

      toast({
        title: 'Session Requested',
        description: 'Your appointment request has been sent. You can track its status on your dashboard.',
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
            <CalendarCheck className="h-10 w-10 text-primary" />
            <div>
              <CardTitle className="font-headline text-3xl">Book a Session</CardTitle>
              <CardDescription>Schedule a confidential session with a faculty member.</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-6">
               <FormField
                control={form.control}
                name="staffId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2"><User /> Faculty Member</FormLabel>
                     <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a faculty member" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {faculty.map(f => (
                            <SelectItem key={f.uid} value={f.uid}>{f.name} - {f.department || 'N/A'}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
               <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2"><FileText /> Session Type</FormLabel>
                     <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select session type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="Academic Guidance">Academic Guidance</SelectItem>
                          <SelectItem value="Grievance Redressal">Grievance Redressal</SelectItem>
                          <SelectItem value="Mentorship">Mentorship</SelectItem>
                        </SelectContent>
                      </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2"><FileText /> Reason for Appointment</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Briefly explain what you would like to discuss." {...field} className="min-h-[150px]" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full justify-center" disabled={isLoading}>
                {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
                Request Session
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
