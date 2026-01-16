import type { UserProfile } from '@/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { TrendingUp, ShieldCheck, Megaphone, CheckCircle } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import ComplaintViewer from '@/components/parent/complaint-viewer';

export default function ParentDashboard({ userProfile }: { userProfile: UserProfile }) {
  // Mock data for childrenUids for demonstration purposes
  const augmentedUserProfile: UserProfile = {
      ...userProfile,
      childrenUids: userProfile.childrenUids || ['student123_mock_uid']
  }
  return (
    <div className="space-y-6">
        <div className="flex justify-between items-center">
            <h1 className="font-headline text-3xl font-bold">Parent &amp; Visitor Portal</h1>
            <p className="text-muted-foreground">Welcome, {userProfile.name}</p>
        </div>

        <ComplaintViewer userProfile={augmentedUserProfile} />

        <Card className="bg-gradient-to-r from-primary to-blue-600 text-primary-foreground">
            <CardHeader>
                <CardTitle className="flex items-center gap-2"><ShieldCheck /> Campus Safety Score</CardTitle>
            </CardHeader>
            <CardContent className="flex items-center justify-between">
                <div>
                    <p className="text-6xl font-bold">92.5</p>
                    <p className="flex items-center gap-1 text-sm opacity-80"><TrendingUp className="h-4 w-4" /> +1.5 from last month</p>
                </div>
                <div className="w-1/2">
                    <p className="text-sm text-right mb-1">Overall Score</p>
                    <Progress value={92.5} className="h-3 [&>*]:bg-white" />
                </div>
            </CardContent>
        </Card>

        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2"><Megaphone/> Recent Initiatives</CardTitle>
                <CardDescription>Updates on how we're making the campus safer and more inclusive.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="flex items-start gap-4">
                    <CheckCircle className="h-5 w-5 mt-1 text-accent" />
                    <div>
                        <h4 className="font-semibold">New Campus Lighting Project</h4>
                        <p className="text-sm text-muted-foreground">Completed the installation of 50 new LED lights in parking lots and walkways.</p>
                    </div>
                </div>
                <div className="flex items-start gap-4">
                    <CheckCircle className="h-5 w-5 mt-1 text-accent" />
                    <div>
                        <h4 className="font-semibold">Mental Wellness Workshops</h4>
                        <p className="text-sm text-muted-foreground">Launched a new series of workshops on stress management and mental health awareness.</p>
                    </div>
                </div>
                <div className="flex items-start gap-4">
                    <CheckCircle className="h-5 w-5 mt-1 text-accent" />
                    <div>
                        <h4 className="font-semibold">Enhanced Guard Training</h4>
                        <p className="text-sm text-muted-foreground">All security personnel have completed advanced de-escalation and cultural sensitivity training.</p>
                    </div>
                </div>
            </CardContent>
        </Card>
    </div>
  );
}

    