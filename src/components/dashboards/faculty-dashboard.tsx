import type { UserProfile, Appointment } from '@/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check, Clock, User, Calendar } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { format } from 'date-fns';


const mockAppointments: Appointment[] = [
    {
        id: '1',
        studentId: 's1',
        studentName: 'Alice Johnson',
        staffId: 'f1',
        staffName: 'Dr. Evelyn Reed',
        type: 'Academic Guidance',
        time: new Date(2024, 6, 25, 10, 0),
        status: 'pending',
    },
    {
        id: '2',
        studentId: 's2',
        studentName: 'Bob Williams',
        staffId: 'f1',
        staffName: 'Dr. Evelyn Reed',
        type: 'Grievance Redressal',
        time: new Date(2024, 6, 26, 14, 30),
        status: 'approved',
    },
    {
        id: '3',
        studentId: 's3',
        studentName: 'Charlie Brown',
        staffId: 'f1',
        staffName: 'Dr. Evelyn Reed',
        type: 'Mentorship',
        time: new Date(2024, 6, 28, 11, 0),
        status: 'pending',
    }
];

export default function FacultyDashboard({ userProfile }: { userProfile: UserProfile }) {
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
                  <div className="text-2xl font-bold">{mockAppointments.filter(a => a.status === 'pending').length}</div>
                  <p className="text-xs text-muted-foreground">Awaiting your approval</p>
              </CardContent>
          </Card>
          <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Upcoming Sessions</CardTitle>
                  <Calendar className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                  <div className="text-2xl font-bold">{mockAppointments.filter(a => a.status === 'approved').length}</div>
                   <p className="text-xs text-muted-foreground">Confirmed appointments</p>
              </CardContent>
          </Card>
          <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Students</CardTitle>
                  <User className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                  <div className="text-2xl font-bold">3</div>
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
                      {mockAppointments.map(apt => (
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
                                  {apt.status === 'pending' && (
                                    <div className="space-x-2">
                                      <Button variant="outline" size="sm">Reschedule</Button>
                                      <Button size="sm">
                                        <Check className="mr-2 h-4 w-4" /> Approve
                                      </Button>
                                    </div>
                                  )}
                              </TableCell>
                          </TableRow>
                      ))}
                  </TableBody>
              </Table>
          </CardContent>
      </Card>
    </div>
  );
}
