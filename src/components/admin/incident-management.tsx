'use client';
import { useState } from 'react';
import { doc, updateDoc, serverTimestamp, addDoc, collection, deleteDoc } from 'firebase/firestore';
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
import { HeartPulse, MoreHorizontal, Loader2, Upload, Trash2 } from 'lucide-react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuTrigger,
    DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { useFirestore } from '@/firebase';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';


interface IncidentManagementProps {
    incidents: Incident[];
    isLoading: boolean;
}

export default function IncidentManagement({ incidents, isLoading: loading }: IncidentManagementProps) {
    const { toast } = useToast();
    const firestore = useFirestore();
    const [incidentToDelete, setIncidentToDelete] = useState<Incident | null>(null);
    const [isUpdating, setIsUpdating] = useState<string | null>(null);

    const assignWellnessSession = async (incident: Incident) => {
        if (!incident.id || !incident.targetStudentId || !incident.targetStudentName) {
            toast({ variant: 'destructive', title: 'Error', description: 'Incident data is incomplete for wellness assignment.' });
            return;
        }
        if (!firestore) {
            toast({ variant: 'destructive', title: 'Error', description: 'Database connection not available.' });
            return;
        }
        
        if(!incident.id) return;
        setIsUpdating(incident.id);

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
                notes: `Mandatory session following incident #${incident.id.slice(0,5)}... on ${format(incident.timestamp, 'PPP')}. Type: ${incident.type}.`,
            } as Omit<Appointment, 'id'>);

            // Update incident status
            const incidentRef = doc(firestore, 'incidents', incident.id);
            await updateDoc(incidentRef, { status: 'wellness-assigned' });

            toast({ title: 'Success', description: `Wellness session assigned for ${incident.targetStudentName}.` });
        } catch (error) {
            console.error("Error assigning wellness session:", error);
            toast({ variant: 'destructive', title: 'Error', description: 'Failed to assign wellness session.' });
        } finally {
            setIsUpdating(null);
        }
    };

    const handleDeleteIncident = async () => {
        if (!incidentToDelete || !incidentToDelete.id || !firestore) return;
        
        const incidentDocRef = doc(firestore, 'incidents', incidentToDelete.id);
        setIsUpdating(incidentToDelete.id);
        
        deleteDoc(incidentDocRef)
          .then(() => {
            toast({
                title: 'Report Deleted',
                description: `The incident report has been successfully deleted.`,
            });
          })
          .catch((serverError) => {
             errorEmitter.emit('permission-error', new FirestorePermissionError({
                path: incidentDocRef.path,
                operation: 'delete',
            }));
          })
          .finally(() => {
            setIncidentToDelete(null);
            setIsUpdating(null);
          });
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

    const exportToCSV = () => {
        if (!incidents || incidents.length === 0) {
            toast({ variant: 'destructive', title: 'No Data', description: 'There is no incident data to export.' });
            return;
        }

        const headers = ['ID', 'Date', 'Type', 'Status', 'Reported By', 'Target Student', 'Description'];
        const csvRows = [
            headers.join(','),
            ...incidents.map(inc => [
                `"${inc.id}"`,
                `"${format(inc.timestamp, 'yyyy-MM-dd HH:mm:ss')}"`,
                `"${inc.type}"`,
                `"${inc.status}"`,
                `"${inc.reporterName || 'N/A'}"`,
                `"${inc.targetStudentName || inc.targetStudentId || 'N/A'}"`,
                `"${(inc.audioTranscript || '').replace(/"/g, '""')}"`,
            ].join(','))
        ];

        const csvString = csvRows.join('\n');
        const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', 'incident_reports.csv');
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        toast({ title: 'Export Successful', description: 'Incident data has been downloaded as a CSV file.' });
    };

    return (
        <>
            <AlertDialog open={!!incidentToDelete} onOpenChange={(open) => !open && setIncidentToDelete(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                        This action cannot be undone. This will permanently delete this incident report.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={isUpdating === incidentToDelete?.id}>Cancel</AlertDialogCancel>
                        <AlertDialogAction 
                            onClick={handleDeleteIncident} 
                            disabled={isUpdating === incidentToDelete?.id}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                            {isUpdating === incidentToDelete?.id && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Delete Report
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
            <Card>
                <CardHeader>
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                        <div>
                            <CardTitle>Live Incident Feed</CardTitle>
                            <CardDescription>Monitor and manage all reported incidents across campus.</CardDescription>
                        </div>
                        <Button onClick={exportToCSV} variant="outline">
                            <Upload className="mr-2 h-4 w-4" />
                            Export to CSV
                        </Button>
                    </div>
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
                            ) : !incidents || incidents.length === 0 ? (
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
                                        {isUpdating === incident.id ? (
                                            <Loader2 className="h-5 w-5 animate-spin ml-auto" />
                                        ) : (
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
                                                    <DropdownMenuSeparator />
                                                    <DropdownMenuItem
                                                        className="text-destructive focus:bg-destructive/10 focus:text-destructive"
                                                        onClick={() => setIncidentToDelete(incident)}
                                                    >
                                                        <Trash2 className="mr-2 h-4 w-4" />
                                                        Delete Report
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        )}
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </>
    );
}
