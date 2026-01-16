'use client';

import { useAuth } from '@/hooks/use-auth';
import { collection, query, where } from 'firebase/firestore';
import type { Appointment } from '@/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { Calendar, Clock, Loader2, CheckCircle } from 'lucide-react';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';

export default function SessionTracker() {
  const { user } = useAuth();
  const firestore = useFirestore();

  const appointmentsQuery = useMemoFirebase(() => {
    if (!user || !firestore) return null;
    return query(collection(firestore, 'appointments'), where('studentId', '==', user.uid));
  }, [user, firestore]);

  const { data: rawAppointments, isLoading: loading } = useCollection<Appointment>(appointmentsQuery);

  const appointments = rawAppointments
    ? rawAppointments.map(apt => ({
        ...apt,
        time: (apt.time as any)?.toDate ? (apt.time as any).toDate() : apt.time,
      })).sort((a,b) => b.time.getTime() - a.time.getTime())
    : [];
  
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
