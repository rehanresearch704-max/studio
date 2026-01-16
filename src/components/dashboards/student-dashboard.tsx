import type { UserProfile } from '@/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { CalendarCheck, BarChart3, HeartPulse, MessageSquareWarning } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import SessionTracker from '@/components/student/session-tracker';
import ComplaintTracker from '@/components/student/complaint-tracker';

export default function StudentDashboard({ userProfile }: { userProfile: UserProfile }) {
  const router = useRouter();
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="font-headline text-3xl font-bold">Wellness & Guidance Hub</h1>
        <p className="text-muted-foreground">Welcome, {userProfile.name}</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-2">
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
            <CardTitle className="flex items-center gap-2"><MessageSquareWarning className="text-destructive"/> File a Complaint</CardTitle>
            <CardDescription>Report an incident or concern securely and confidentially.</CardDescription>
          </CardHeader>
          <CardContent className="flex-grow flex items-end">
            <Button variant="destructive" className="w-full" onClick={() => router.push('/dashboard/file-complaint')}>Report an Incident</Button>
          </CardContent>
        </Card>
      </div>

      <SessionTracker />
      <ComplaintTracker />
      
    </div>
  );
}

    