import type { UserProfile } from '@/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { CalendarCheck, BarChart3, HeartPulse } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import SessionTracker from '@/components/student/session-tracker';

export default function StudentDashboard({ userProfile }: { userProfile: UserProfile }) {
  const router = useRouter();
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="font-headline text-3xl font-bold">Wellness & Guidance Hub</h1>
        <p className="text-muted-foreground">Welcome, {userProfile.name}</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card className="flex flex-col">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><CalendarCheck className="text-primary"/> Book a Session</CardTitle>
            <CardDescription>Connect with faculty for guidance, mentorship, or to address grievances.</CardDescription>
          </CardHeader>
          <CardContent className="flex-grow flex items-end">
            <Button className="w-full" onClick={() => router.push('/dashboard/book-session')}>Find a Mentor</Button>
          </CardContent>
        </Card>
        <Card className="flex flex-col">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><BarChart3 className="text-accent"/>Track Your Requests</CardTitle>
            <CardDescription>View the real-time status of your pending and approved appointments.</CardDescription>
          </CardHeader>
          <CardContent className="flex-grow flex items-end">
            <Button variant="outline" className="w-full" onClick={() => router.push('/dashboard/my-sessions')}>View My Sessions</Button>
          </CardContent>
        </Card>
        <Card className="flex flex-col">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><HeartPulse className="text-destructive"/> Wellness Manager</CardTitle>
            <CardDescription>Your private portal for stigma-free mental health appointments.</CardDescription>
          </CardHeader>
          <CardContent className="flex-grow flex items-end">
            <Button variant="secondary" className="w-full" onClick={() => router.push('/dashboard/wellness')}>Access Wellness</Button>
          </CardContent>
        </Card>
      </div>

      <SessionTracker />
      
    </div>
  );
}
