'use client';
import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { collection, query, where, onSnapshot, DocumentData, QuerySnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Incident } from '@/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { Loader2, Shield } from 'lucide-react';

export default function PastReportsPage() {
  const { user } = useAuth();
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }
    
    const q = query(collection(db, 'incidents'), where('reporterId', '==', user.uid));

    const unsubscribe = onSnapshot(q, (snapshot: QuerySnapshot<DocumentData>) => {
      const incidentsData = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          timestamp: data.timestamp?.toDate(),
        } as Incident;
      }).sort((a,b) => b.timestamp.getTime() - a.timestamp.getTime());
      setIncidents(incidentsData);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

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
