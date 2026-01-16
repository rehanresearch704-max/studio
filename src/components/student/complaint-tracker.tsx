'use client';

import { useAuth } from '@/hooks/use-auth';
import { collection, query, where, or } from 'firebase/firestore';
import type { Incident } from '@/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { Loader2, ShieldAlert } from 'lucide-react';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';

export default function ComplaintTracker() {
  const { user } = useAuth();
  const firestore = useFirestore();

  const incidentsQuery = useMemoFirebase(() => {
    if (!user || !firestore) return null;
    return query(
        collection(firestore, 'incidents'), 
        or(
            where('reporterId', '==', user.uid),
            where('targetStudentId', '==', user.uid)
        )
    );
  }, [user, firestore]);
  
  const { data: rawIncidents, isLoading: loading } = useCollection<Incident>(incidentsQuery);

  const incidents = rawIncidents
    ? rawIncidents.map(inc => ({
        ...inc,
        timestamp: (inc.timestamp as any)?.toDate ? (inc.timestamp as any).toDate() : inc.timestamp,
      })).sort((a,b) => b.timestamp.getTime() - a.timestamp.getTime())
    : [];

  const getStatusBadgeVariant = (status: Incident['status']) => {
      switch(status) {
          case 'reported': return 'destructive';
          case 'in-progress': return 'secondary';
          case 'resolved': return 'default';
          case 'wellness-assigned': return 'outline';
          default: return 'secondary';
      }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>My Incident Reports</CardTitle>
        <CardDescription>A summary of incidents you have reported or been involved in.</CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center p-8"><Loader2 className="h-8 w-8 animate-spin" /></div>
        ) : incidents.length === 0 ? (
          <div className="text-center text-muted-foreground py-8">
            <ShieldAlert className="mx-auto h-12 w-12"/>
            <p className="mt-4">You have no incidents on record.</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Your Role</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {incidents.map(incident => (
                <TableRow key={incident.id}>
                  <TableCell>{format(incident.timestamp, 'MMM d, yyyy')}</TableCell>
                  <TableCell>{incident.type}</TableCell>
                   <TableCell>
                    <Badge variant={incident.reporterId === user?.uid ? 'default' : 'secondary'}>
                      {incident.reporterId === user?.uid ? 'Reporter' : 'Involved'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={getStatusBadgeVariant(incident.status)}>
                      {incident.status}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
