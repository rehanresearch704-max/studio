import type { UserProfile } from '@/types';
import IncidentReporter from '@/components/guard/incident-reporter';

export default function GuardDashboard({ userProfile }: { userProfile: UserProfile }) {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="font-headline text-3xl font-bold">Silent Sentinel Hub</h1>
        <p className="text-muted-foreground">Guard ID: {userProfile.uid.slice(0, 8)}</p>
      </div>
      <IncidentReporter guardId={userProfile.uid} />
    </div>
  );
}
