'use client';

import { collection, query, where } from 'firebase/firestore';
import type { Incident, UserProfile } from '@/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { Loader2, ShieldAlert, AlertTriangle } from 'lucide-react';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';

export default function ComplaintViewer({ userProfile }: { userProfile: UserProfile }) {
  const firestore = useFirestore();

  const incidentsQuery = useMemoFirebase(() => {
    if (!firestore || !userProfile.childrenUids || userProfile.childrenUids.length === 0) {
      return null;
    }
    return query(collection(firestore, 'incidents'), where('targetStudentId', 'in', userProfile.childrenUids));
  }, [firestore, userProfile.childrenUids]);

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

  // Handle case where there are no childrenUids to query on.
  if (!userProfile.childrenUids || userProfile.childrenUids.length === 0) {
      // Intentionally not showing a loading spinner here, as there's nothing to load.
      return (
           <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><AlertTriangle className="text-destructive"/> Child Incident Log</CardTitle>
                <CardDescription>This is a log of any campus incidents involving your child.</CardDescription>
              </CardHeader>
              <CardContent>
                 <div className="text-center text-muted-foreground py-8">
                    <ShieldAlert className="mx-auto h-12 w-12"/>
                    <p className="mt-4">No children are linked to this account to view incidents.</p>
                </div>
              </CardContent>
            </Card>
      )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><AlertTriangle className="text-destructive"/> Child Incident Log</CardTitle>
        <CardDescription>This is a log of any campus incidents involving your child.</CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center p-8"><Loader2 className="h-8 w-8 animate-spin" /></div>
        ) : incidents.length === 0 ? (
          <div className="text-center text-muted-foreground py-8">
            <ShieldAlert className="mx-auto h-12 w-12"/>
            <p className="mt-4">There are no incidents on record for your child.</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Incident Type</TableHead>
                <TableHead>Student</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {incidents.map(incident => (
                <TableRow key={incident.id}>
                  <TableCell>{format(incident.timestamp, 'MMM d, yyyy')}</TableCell>
                  <TableCell>{incident.type}</TableCell>
                  <TableCell>{incident.targetStudentName || 'N/A'}</TableCell>
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
