'use client'

import type { UserProfile, Incident } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Users, ShieldAlert, Loader2 } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import IncidentManagement from '@/components/admin/incident-management';
import IncidentHeatmap from '@/components/admin/incident-heatmap';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query } from 'firebase/firestore';


export default function AdminDashboard({ userProfile }: { userProfile: UserProfile }) {
  const firestore = useFirestore();

  const incidentsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'incidents'));
  }, [firestore]);

  const { data: rawIncidents, isLoading: incidentsLoading } = useCollection<Incident>(incidentsQuery);

  const incidents = rawIncidents
    ? rawIncidents.map(inc => ({
        ...inc,
        id: inc.id,
        timestamp: (inc.timestamp as any)?.toDate ? (inc.timestamp as any).toDate() : new Date(),
      })).sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
    : [];

  const usersQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'users'));
  }, [firestore]);
  const { data: users, isLoading: usersLoading } = useCollection<UserProfile>(usersQuery);


  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="font-headline text-3xl font-bold">Administrator Dashboard</h1>
        <p className="text-muted-foreground">Welcome, {userProfile.name}</p>
      </div>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Incidents
            </CardTitle>
            <ShieldAlert className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{incidentsLoading ? <Loader2 className="h-6 w-6 animate-spin"/> : incidents.length}</div>
            <p className="text-xs text-muted-foreground">
              Total incidents reported
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Active Users
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{usersLoading ? <Loader2 className="h-6 w-6 animate-spin"/> : users?.length || 0}</div>
            <p className="text-xs text-muted-foreground">
              Campus community members
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Safety Score</CardTitle>
            <BarChart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">92.5%</div>
            <p className="text-xs text-muted-foreground">
              Calculated from campus data
            </p>
          </CardContent>
        </Card>
      </div>
        <Tabs defaultValue="management" className="space-y-4">
            <TabsList>
                <TabsTrigger value="management">Incident Management</TabsTrigger>
                <TabsTrigger value="heatmap">Incident Heatmap</TabsTrigger>
            </TabsList>
            <TabsContent value="management">
                <IncidentManagement incidents={incidents} isLoading={incidentsLoading} />
            </TabsContent>
            <TabsContent value="heatmap">
                <IncidentHeatmap incidents={incidents} isLoading={incidentsLoading} />
            </TabsContent>
        </Tabs>

    </div>
  );
}
