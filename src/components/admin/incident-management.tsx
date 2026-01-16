'use client';
import { useState, useEffect } from 'react';
import { collection, onSnapshot, QuerySnapshot, DocumentData, doc, updateDoc, serverTimestamp, addDoc, GeoPoint } from 'firebase/firestore';
import { db } from '@/lib/firebase';
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
import { HeartPulse, MoreHorizontal } from 'lucide-react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';


// Mock data for initial load until Firestore connects
const mockIncidents: Incident[] = [
    {
        id: 'inc1',
        timestamp: new Date(),
        type: 'Verbal Abuse',
        location: new GeoPoint(17.2945, 78.4730),
        status: 'reported',
        hashedGuardId: 'hashed123',
        involvedStudentId: 'stud123',
        involvedStudentName: 'John Doe',
    },
    {
        id: 'inc2',
        timestamp: new Date(),
        type: 'Intimidation',
        location: new GeoPoint(17.2950, 78.4725),
        status: 'wellness-assigned',
        hashedGuardId: 'hashed456',
        involvedStudentId: 'stud456',
        involvedStudentName: 'Jane Smith',
    }
];


export default function IncidentManagement() {
    const [incidents, setIncidents] = useState<Incident[]>(mockIncidents);
    const [loading, setLoading] = useState(true);
    const { toast } = useToast();

    useEffect(() => {
        const unsubscribe = onSnapshot(collection(db, 'incidents'), (snapshot: QuerySnapshot<DocumentData>) => {
            const incidentsData = snapshot.docs.map(doc => {
                const data = doc.data();
                return { 
                    id: doc.id,
                    ...data,
                    timestamp: data.timestamp?.toDate() // Convert Firestore Timestamp to JS Date
                } as Incident;
            }).sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
            
            setIncidents(incidentsData);
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const assignWellnessSession = async (incident: Incident) => {
        if (!incident.id || !incident.involvedStudentId || !incident.involvedStudentName) {
            toast({ variant: 'destructive', title: 'Error', description: 'Incident data is incomplete.' });
            return;
        }

        try {
            // Create a new appointment
            await addDoc(collection(db, 'appointments'), {
                studentId: incident.involvedStudentId,
                studentName: incident.involvedStudentName,
                staffId: 'wellness_dept', // Generic ID for the wellness department
                staffName: 'Wellness Center',
                type: 'Wellness Session',
                time: serverTimestamp(),
                status: 'pending',
                notes: `Mandatory session following incident #${incident.id} on ${format(incident.timestamp, 'PPP')}. Type: ${incident.type}.`,
            } as Omit<Appointment, 'id'>);

            // Update incident status
            const incidentRef = doc(db, 'incidents', incident.id);
            await updateDoc(incidentRef, { status: 'wellness-assigned' });

            toast({ title: 'Success', description: `Wellness session assigned for ${incident.involvedStudentName}.` });
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
                            <TableHead>Student Involved</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading && incidents.length === 0 ? (
                           <TableRow><TableCell colSpan={5} className="text-center">Loading incidents...</TableCell></TableRow> 
                        ) : incidents.map(incident => (
                            <TableRow key={incident.id}>
                                <TableCell>{format(incident.timestamp, 'MMM d, yyyy h:mm a')}</TableCell>
                                <TableCell>{incident.type}</TableCell>
                                <TableCell>{incident.involvedStudentName || 'N/A'}</TableCell>
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
                                                disabled={!incident.involvedStudentId || incident.status === 'wellness-assigned'}
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
