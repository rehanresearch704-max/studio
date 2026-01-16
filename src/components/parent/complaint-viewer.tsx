'use client';

import { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, DocumentData, QuerySnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Incident, UserProfile } from '@/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { Loader2, ShieldAlert, AlertTriangle } from 'lucide-react';

export default function ComplaintViewer({ userProfile }: { userProfile: UserProfile }) {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userProfile.childrenUids || userProfile.childrenUids.length === 0) {
      setLoading(false);
      return;
    }
    
    const q = query(collection(db, 'incidents'), where('targetStudentId', 'in', userProfile.childrenUids));
    
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
    }, (error) => {
        console.error("Error fetching child incidents:", error);
        setLoading(false);
    });

    return () => unsubscribe();
  }, [userProfile.childrenUids]);
  
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

    