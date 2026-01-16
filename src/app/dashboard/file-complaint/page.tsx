'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { addDoc, collection, serverTimestamp, GeoPoint, query, where, getDocs } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { v4 as uuidv4 } from 'uuid';
import { Loader2, Send, ShieldAlert, User, FileText, Paperclip, Camera } from 'lucide-react';
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
import { db, storage } from '@/lib/firebase';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useAuth } from '@/hooks/use-auth';
import { Incident, UserProfile } from '@/types';
import { classifyIncidentType } from '@/ai/flows/classify-incident-type';
import { Progress } from '@/components/ui/progress';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

const formSchema = z.object({
  targetStudentId: z.string().min(1, { message: 'Please enter the ID of the student you are reporting.' }),
  description: z.string().min(20, { message: 'Please provide a detailed description of the incident (min. 20 characters).' }),
  voiceRecording: z.any().optional(),
  mediaFiles: z.any().optional(),
});

export default function FileComplaintPage() {
  const { toast } = useToast();
  const { user, userProfile } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      targetStudentId: '',
      description: '',
    },
  });

  const uploadFile = async (file: File, path: string): Promise<string> => {
    const storageRef = ref(storage, path);
    await uploadBytes(storageRef, file);
    return getDownloadURL(storageRef);
  };

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!user || !userProfile) {
      toast({ variant: 'destructive', title: 'Authentication Error', description: 'You must be logged in to file a complaint.' });
      return;
    }

    setIsLoading(true);
    setUploadProgress(0);
    
    try {
      // Step 1: Fetch target student's name
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
      
      // Step 2: Upload files
      let voiceRecordingUrl: string | undefined = undefined;
      let mediaUrls: string[] = [];
      const totalFiles = (values.voiceRecording?.[0] ? 1 : 0) + (values.mediaFiles?.length || 0);
      let filesUploaded = 0;

      if (values.voiceRecording && values.voiceRecording[0]) {
        const file = values.voiceRecording[0];
        const filePath = `incidents/${uuidv4()}-${file.name}`;
        voiceRecordingUrl = await uploadFile(file, filePath);
        filesUploaded++;
        setUploadProgress((filesUploaded / totalFiles) * 100);
      }

      if (values.mediaFiles && values.mediaFiles.length > 0) {
        for (const file of Array.from(values.mediaFiles as FileList)) {
          const filePath = `incidents/${uuidv4()}-${file.name}`;
          const url = await uploadFile(file, filePath);
          mediaUrls.push(url);
          filesUploaded++;
          setUploadProgress((filesUploaded / totalFiles) * 100);
        }
      }

      // Step 3: Classify incident type via AI
      const classification = await classifyIncidentType({ audioTranscript: values.description });

      // Step 4: Prepare incident data
      const newIncident: Omit<Incident, 'id'> = {
        timestamp: serverTimestamp() as any,
        type: classification.incidentType,
        audioTranscript: values.description,
        location: new GeoPoint(0, 0), // Location not applicable for student-filed complaints
        status: 'reported',
        reporterId: user.uid,
        reporterName: userProfile.name,
        targetStudentId: values.targetStudentId,
        targetStudentName: targetStudentName,
        voiceRecordingUrl,
        mediaUrls,
      };

      // Step 5: Submit to Firestore (non-blocking)
      addDoc(collection(db, 'incidents'), newIncident)
        .then(() => {
          toast({
            title: 'Complaint Filed Successfully',
            description: 'Your report has been submitted for review.',
          });
          form.reset();
        })
        .catch((serverError) => {
          errorEmitter.emit('permission-error', new FirestorePermissionError({
            path: 'incidents',
            operation: 'create',
            requestResourceData: newIncident,
          }));
        })
        .finally(() => {
          setIsLoading(false);
          setUploadProgress(0);
        });

    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Submission Failed',
        description: error.message || 'An unexpected error occurred during pre-submission steps. Please try again.',
      });
      setIsLoading(false);
      setUploadProgress(0);
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
              <FormField
                control={form.control}
                name="voiceRecording"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2"><Paperclip /> Attach Voice Memo</FormLabel>
                    <FormControl>
                      <Input type="file" accept="audio/*" {...form.register('voiceRecording')} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="mediaFiles"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2"><Camera /> Attach Photos/Videos</FormLabel>
                    <FormControl>
                      <Input type="file" accept="image/*,video/*" multiple {...form.register('mediaFiles')} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              {isLoading && <Progress value={uploadProgress} className="w-full" />}
              <Button type="submit" className="w-full justify-center" disabled={isLoading}>
                {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
                {isLoading ? `Submitting... ${uploadProgress.toFixed(0)}%` : 'Submit Secure Report'}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
