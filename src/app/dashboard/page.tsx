'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';

import StudentDashboard from '@/components/dashboards/student-dashboard';
import AdminDashboard from '@/components/dashboards/admin-dashboard';
import GuardDashboard from '@/components/dashboards/guard-dashboard';
import FacultyDashboard from '@/components/dashboards/faculty-dashboard';
import ParentDashboard from '@/components/dashboards/parent-dashboard';
import VisitorDashboard from '@/components/dashboards/visitor-dashboard';
import { Loader2 } from 'lucide-react';
import SOSButton from '@/components/shared/sos-button';

export default function DashboardPage() {
  const { user, userProfile, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/');
    }
  }, [user, loading, router]);

  if (loading || !userProfile) {
    return (
      <div className="flex h-full w-full items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="ml-4 text-lg">Loading your dashboard...</p>
      </div>
    );
  }

  const renderDashboard = () => {
    switch (userProfile.role) {
      case 'student':
        return <StudentDashboard userProfile={userProfile} />;
      case 'admin':
        return <AdminDashboard userProfile={userProfile} />;
      case 'guard':
        return <GuardDashboard userProfile={userProfile} />;
      case 'faculty':
        return <FacultyDashboard userProfile={userProfile} />;
      case 'parent':
        return <ParentDashboard userProfile={userProfile} />;
      case 'visitor':
        return <VisitorDashboard userProfile={userProfile} />;
      default:
        return (
          <div>
            <h1 className="text-2xl font-bold">Error</h1>
            <p>Unknown user role. Please contact support.</p>
          </div>
        );
    }
  };

  return (
    <div className="relative h-full">
      {renderDashboard()}
      {userProfile.role === 'student' && <SOSButton />}
    </div>
  );
}
