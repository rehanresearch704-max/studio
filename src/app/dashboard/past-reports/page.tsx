'use client';
import { useAuth } from '@/hooks/use-auth';
import { collection, query, where } from 'firebase/firestore';
import type { Incident } from '@/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { Loader2, Shield } from 'lucide-react';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';

export default function PastReportsPage() {
  const { user } = useAuth();
  const firestore = useFirestore();

  const incidentsQuery = useMemoFirebase(() => {
    if (!user || !firestore) return null;
    return query(collection(firestore, 'incidents'), where('reporterId', '==', user.uid));
  }, [user, firestore]);

  const { data: rawIncidents, isLoading: loading } = useCollection<Incident>(incidentsQuery);

  const incidents = rawIncidents
    ? rawIncidents.map(inc => ({
        ...inc,
        timestamp: (inc.timestamp as any)?.toDate ? (inc.timestamp as any).toDate() : inc.timestamp,
      })).sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
    : [];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><Shield /> My Past Reports</CardTitle>
        <CardDescription>A log of all incidents you have reported.</CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center p-8"><Loader2 className="h-8 w-8 animate-spin" /></div>
        ) : incidents.length === 0 ? (
          <div className="text-center text-muted-foreground py-8">
            <Shield className="mx-auto h-12 w-12"/>
            <p className="mt-4">You have not filed any reports.</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Student Involved</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {incidents.map(incident => (
                <TableRow key={incident.id}>
                  <TableCell>{format(incident.timestamp, 'MMM d, yyyy')}</TableCell>
                  <TableCell>{incident.type}</TableCell>
                   <TableCell>
                     <Badge variant={incident.status === 'reported' ? 'destructive' : 'default'}>
                      {incident.status}
                    </Badge>
                  </TableCell>
                  <TableCell>{incident.targetStudentName || incident.targetStudentId || 'N/A'}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
