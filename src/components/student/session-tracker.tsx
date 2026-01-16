'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { collection, query, where, onSnapshot, DocumentData, QuerySnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Appointment } from '@/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { Calendar, Clock, Loader2, CheckCircle } from 'lucide-react';

export default function SessionTracker() {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }
    const q = query(collection(db, 'appointments'), where('studentId', '==', user.uid));
    const unsubscribe = onSnapshot(q, (snapshot: QuerySnapshot<DocumentData>) => {
      const appointmentsData = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          time: data.time?.toDate(),
        } as Appointment;
      }).sort((a,b) => b.time.getTime() - a.time.getTime());
      setAppointments(appointmentsData);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);
  
  const getStatusBadgeVariant = (status: Appointment['status']) => {
      switch(status) {
          case 'pending': return 'secondary';
          case 'approved': return 'default';
          case 'completed': return 'outline';
          case 'rescheduled': return 'destructive';
          default: return 'secondary';
      }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>My Sessions</CardTitle>
        <CardDescription>Track the status of your mentorship and guidance sessions.</CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center p-8"><Loader2 className="h-8 w-8 animate-spin" /></div>
        ) : appointments.length === 0 ? (
          <div className="text-center text-muted-foreground py-8">
            <Calendar className="mx-auto h-12 w-12"/>
            <p className="mt-4">You have no scheduled sessions.</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Faculty/In-charge</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Date & Time</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {appointments.map(apt => (
                <TableRow key={apt.id}>
                  <TableCell>{apt.staffName}</TableCell>
                  <TableCell>{apt.type}</TableCell>
                  <TableCell>{format(apt.time, 'MMM d, yyyy, h:mm a')}</TableCell>
                  <TableCell>
                    <Badge variant={getStatusBadgeVariant(apt.status)}>
                      {apt.status === 'pending' && <Clock className="mr-1 h-3 w-3"/>}
                      {apt.status === 'approved' && <CheckCircle className="mr-1 h-3 w-3"/>}
                      {apt.status}
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
