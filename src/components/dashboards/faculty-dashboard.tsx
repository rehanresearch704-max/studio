'use client';
import type { UserProfile, Appointment } from '@/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check, Clock, User, Calendar } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { format } from 'date-fns';
import { collection, query, where, doc, updateDoc } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';


export default function FacultyDashboard({ userProfile }: { userProfile: UserProfile }) {
    const { toast } = useToast();
    const firestore = useFirestore();

    const appointmentsQuery = useMemoFirebase(() => {
        if (!userProfile?.uid || !firestore) return null;
        return query(collection(firestore, 'appointments'), where('staffId', '==', userProfile.uid));
    }, [userProfile?.uid, firestore]);
    
    const { data: rawAppointments, isLoading: loading } = useCollection<Appointment>(appointmentsQuery);

    const appointments = rawAppointments
        ? rawAppointments.map(apt => ({
            ...apt,
            time: (apt.time as any)?.toDate ? (apt.time as any).toDate() : apt.time,
        })).sort((a, b) => a.time.getTime() - b.time.getTime())
        : [];

    const handleApprove = async (appointmentId?: string) => {
        if (!appointmentId || !firestore) return;
        const appointmentRef = doc(firestore, 'appointments', appointmentId);
        try {
            await updateDoc(appointmentRef, { status: 'approved' });
            toast({ title: 'Success', description: 'Appointment approved.' });
        } catch (error) {
            toast({ variant: 'destructive', title: 'Error', description: 'Failed to approve appointment.' });
        }
    };
    
    const pendingAppointments = appointments.filter(a => a.status === 'pending');
    const upcomingAppointments = appointments.filter(a => a.status === 'approved');

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="font-headline text-3xl font-bold">Faculty Dashboard</h1>
        <p className="text-muted-foreground">Welcome, {userProfile.name}</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Pending Requests</CardTitle>
                  <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                  <div className="text-2xl font-bold">{loading ? <Loader2 className="h-6 w-6 animate-spin"/> : pendingAppointments.length}</div>
                  <p className="text-xs text-muted-foreground">Awaiting your approval</p>
              </CardContent>
          </Card>
          <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Upcoming Sessions</CardTitle>
                  <Calendar className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                  <div className="text-2xl font-bold">{loading ? <Loader2 className="h-6 w-6 animate-spin"/> : upcomingAppointments.length}</div>
                   <p className="text-xs text-muted-foreground">Confirmed appointments</p>
              </CardContent>
          </Card>
          <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Students</CardTitle>
                  <User className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                  <div className="text-2xl font-bold">{loading ? <Loader2 className="h-6 w-6 animate-spin"/> : new Set(appointments.map(a => a.studentId)).size}</div>
                   <p className="text-xs text-muted-foreground">You are mentoring</p>
              </CardContent>
          </Card>
      </div>

      <Card>
          <CardHeader>
              <CardTitle>Session Requests</CardTitle>
              <CardDescription>Review and manage incoming requests from students.</CardDescription>
          </CardHeader>
          <CardContent>
              {loading ? (
                  <div className="flex items-center justify-center p-8"><Loader2 className="h-8 w-8 animate-spin" /></div>
              ) : (
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Student</TableHead>
                            <TableHead>Type</TableHead>
                            <TableHead>Date & Time</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {appointments.length > 0 ? appointments.map(apt => (
                            <TableRow key={apt.id}>
                                <TableCell>{apt.studentName}</TableCell>
                                <TableCell>{apt.type}</TableCell>
                                <TableCell>{format(apt.time, 'MMM d, yyyy, h:mm a')}</TableCell>
                                <TableCell>
                                   <Badge variant={apt.status === 'pending' ? 'secondary' : apt.status === 'approved' ? 'default' : 'destructive'}>
                                      {apt.status}
                                    </Badge>
                                </TableCell>
                                <TableCell className="text-right">
                                    {apt.status === 'pending' && apt.id && (
                                      <div className="space-x-2">
                                        <Button variant="outline" size="sm">Reschedule</Button>
                                        <Button size="sm" onClick={() => handleApprove(apt.id)}>
                                          <Check className="mr-2 h-4 w-4" /> Approve
                                        </Button>
                                      </div>
                                    )}
                                </TableCell>
                            </TableRow>
                        )) : (
                            <TableRow>
                                <TableCell colSpan={5} className="text-center">No session requests found.</TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
              )}
          </CardContent>
      </Card>
    </div>
  );
}
