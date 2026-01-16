'use client';
import { collection, doc, updateDoc, serverTimestamp, addDoc, query } from 'firebase/firestore';
import type { Incident, Appointment } from '@/types';
import { format } from 'date-fns';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { HeartPulse, MoreHorizontal, Loader2 } from 'lucide-react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';


export default function IncidentManagement() {
    const { toast } = useToast();
    const firestore = useFirestore();

    const incidentsQuery = useMemoFirebase(() => {
        if (!firestore) return null;
        return query(collection(firestore, 'incidents'));
    }, [firestore]);

    const { data: rawIncidents, isLoading: loading } = useCollection<Incident>(incidentsQuery);

    const incidents = rawIncidents
        ? rawIncidents.map(inc => ({
            ...inc,
            timestamp: (inc.timestamp as any)?.toDate ? (inc.timestamp as any).toDate() : inc.timestamp,
        })).sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
        : [];

    const assignWellnessSession = async (incident: Incident) => {
        if (!incident.id || !incident.targetStudentId || !incident.targetStudentName) {
            toast({ variant: 'destructive', title: 'Error', description: 'Incident data is incomplete for wellness assignment.' });
            return;
        }
        if (!firestore) {
            toast({ variant: 'destructive', title: 'Error', description: 'Database connection not available.' });
            return;
        }

        try {
            // Create a new appointment
            await addDoc(collection(firestore, 'appointments'), {
                studentId: incident.targetStudentId,
                studentName: incident.targetStudentName,
                staffId: 'wellness_dept', // Generic ID for the wellness department
                staffName: 'Wellness Center',
                type: 'Wellness Session',
                time: serverTimestamp(),
                status: 'pending',
                notes: `Mandatory session following incident #${incident.id} on ${format(incident.timestamp, 'PPP')}. Type: ${incident.type}.`,
            } as Omit<Appointment, 'id'>);

            // Update incident status
            const incidentRef = doc(firestore, 'incidents', incident.id);
            await updateDoc(incidentRef, { status: 'wellness-assigned' });

            toast({ title: 'Success', description: `Wellness session assigned for ${incident.targetStudentName}.` });
        } catch (error) {
            console.error("Error assigning wellness session:", error);
            toast({ variant: 'destructive', title: 'Error', description: 'Failed to assign wellness session.' });
        }
    };
    
    const getStatusBadgeVariant = (status: Incident['status']) => {
        switch (status) {
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
                <CardTitle>Live Incident Feed</CardTitle>
                <CardDescription>Monitor and manage all reported incidents across campus.</CardDescription>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Date</TableHead>
                            <TableHead>Type</TableHead>
                            <TableHead>Reported By</TableHead>
                            <TableHead>Target Student</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                           <TableRow><TableCell colSpan={6} className="h-24 text-center"><Loader2 className="mx-auto h-6 w-6 animate-spin" /></TableCell></TableRow> 
                        ) : incidents.length === 0 ? (
                            <TableRow><TableCell colSpan={6} className="text-center">No incidents reported yet.</TableCell></TableRow>
                        ) : incidents.map(incident => (
                            <TableRow key={incident.id}>
                                <TableCell>{format(incident.timestamp, 'MMM d, yyyy h:mm a')}</TableCell>
                                <TableCell>{incident.type}</TableCell>
                                <TableCell>{incident.reporterName || 'N/A'}</TableCell>
                                <TableCell>{incident.targetStudentName || incident.targetStudentId || 'N/A'}</TableCell>
                                <TableCell>
                                    <Badge variant={getStatusBadgeVariant(incident.status)}>{incident.status.replace('-', ' ')}</Badge>
                                </TableCell>
                                <TableCell className="text-right">
                                     <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" className="h-8 w-8 p-0">
                                                <span className="sr-only">Open menu</span>
                                                <MoreHorizontal className="h-4 w-4" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                            <DropdownMenuItem
                                                onClick={() => assignWellnessSession(incident)}
                                                disabled={!incident.targetStudentId || incident.status === 'wellness-assigned'}
                                            >
                                                <HeartPulse className="mr-2 h-4 w-4" />
                                                Assign Wellness Session
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    );
}
