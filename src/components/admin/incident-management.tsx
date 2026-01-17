'use client';
import { useState, useEffect, useCallback } from 'react';
import {
  doc,
  updateDoc,
  serverTimestamp,
  addDoc,
  collection,
  deleteDoc,
  query,
  orderBy,
  where,
  limit,
  startAfter,
  getDocs,
  QueryDocumentSnapshot,
  DocumentData,
} from 'firebase/firestore';
import type { Incident, Appointment, IncidentType, IncidentStatus } from '@/types';
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
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { HeartPulse, MoreHorizontal, Loader2, Upload, Trash2, ChevronLeft, ChevronRight, Filter } from 'lucide-react';
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const PAGE_SIZE = 10;
const incidentTypeOptions: IncidentType[] = ['Verbal Abuse', 'Intimidation', 'Micro-aggressions', 'Other'];
const incidentStatusOptions: IncidentStatus[] = ['reported', 'in-progress', 'resolved', 'wellness-assigned'];

export default function IncidentManagement() {
    const { toast } = useToast();
    const firestore = useFirestore();
    const [incidents, setIncidents] = useState<Incident[]>([]);
    const [loading, setLoading] = useState(true);
    const [incidentToDelete, setIncidentToDelete] = useState<Incident | null>(null);
    const [isUpdating, setIsUpdating] = useState<string | null>(null);

    // Filters and Pagination state
    const [statusFilter, setStatusFilter] = useState<IncidentStatus | 'all'>('all');
    const [typeFilter, setTypeFilter] = useState<IncidentType | 'all'>('all');
    const [currentPage, setCurrentPage] = useState(1);
    const [pageCursors, setPageCursors] = useState<(QueryDocumentSnapshot | null)[]>([null]);
    const [isLastPage, setIsLastPage] = useState(false);

    useEffect(() => {
        if (!firestore) return;
    
        const fetchPage = async () => {
          setLoading(true);
          try {
            let q = query(
              collection(firestore, "incidents"),
              orderBy("timestamp", "desc")
            );
            
            if (statusFilter !== 'all') {
                q = query(q, where('status', '==', statusFilter));
            }
            if (typeFilter !== 'all') {
                q = query(q, where('type', '==', typeFilter));
            }
    
            const cursor = pageCursors[currentPage - 1];
            if (cursor) {
                q = query(q, startAfter(cursor));
            }
            q = query(q, limit(PAGE_SIZE));
            
            const snapshot = await getDocs(q);
            const newIncidents = snapshot.docs.map(doc => ({
              id: doc.id,
              ...doc.data(),
              timestamp: (doc.data().timestamp as any)?.toDate ? (doc.data().timestamp as any).toDate() : new Date(),
            })) as Incident[];
            setIncidents(newIncidents);
            
            setIsLastPage(snapshot.docs.length < PAGE_SIZE);

            if (!snapshot.empty) {
                const lastVisibleDoc = snapshot.docs[snapshot.docs.length - 1];
                if (currentPage >= pageCursors.length) {
                    setPageCursors(prev => [...prev, lastVisibleDoc]);
                }
            } else if (currentPage > 1) {
                // If we land on an empty page that's not the first, it means filters changed
                // or data was deleted. Go back a page.
                setCurrentPage(p => p - 1);
            }

          } catch (e) {
            console.error(e);
            toast({ variant: 'destructive', title: 'Error', description: 'Could not fetch incidents.' });
          } finally {
            setLoading(false);
          }
        };
    
        fetchPage();
      }, [firestore, currentPage, statusFilter, typeFilter]);

    const handleFilterChange = (setter: Function) => (value: string) => {
        setter(value);
        setCurrentPage(1);
        setPageCursors([null]);
    }
    
    const goToNextPage = () => !isLastPage && setCurrentPage(p => p + 1);
    const goToPrevPage = () => currentPage > 1 && setCurrentPage(p => p - 1);

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
            await addDoc(collection(firestore, 'appointments'), {
                studentId: incident.targetStudentId,
                studentName: incident.targetStudentName,
                staffId: 'wellness_dept',
                staffName: 'Wellness Center',
                type: 'Wellness Session',
                time: serverTimestamp(),
                status: 'pending',
                notes: `Mandatory session following incident #${incident.id.slice(0,5)}... on ${format(incident.timestamp, 'PPP')}. Type: ${incident.type}.`,
            } as Omit<Appointment, 'id'>);

            const incidentRef = doc(firestore, 'incidents', incident.id);
            await updateDoc(incidentRef, { status: 'wellness-assigned' });
            
            // Optimistically update UI
            setIncidents(incidents.map(inc => inc.id === incident.id ? {...inc, status: 'wellness-assigned'} : inc));
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
            toast({ title: 'Report Deleted', description: `The incident report has been successfully deleted.` });
            setIncidents(incidents.filter(inc => inc.id !== incidentToDelete.id));
          })
          .catch((serverError) => {
             const permissionError = new FirestorePermissionError({ path: incidentDocRef.path, operation: 'delete' });
             errorEmitter.emit('permission-error', permissionError);
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
                        <AlertDialogDescription>This action cannot be undone. This will permanently delete this incident report.</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={isUpdating === incidentToDelete?.id}>Cancel</AlertDialogCancel>
                        <AlertDialogAction 
                            onClick={handleDeleteIncident} 
                            disabled={isUpdating === incidentToDelete?.id}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
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
                        <Button onClick={exportToCSV} variant="outline"><Upload className="mr-2 h-4 w-4" /> Export to CSV</Button>
                    </div>
                     <div className="flex flex-col sm:flex-row gap-4 pt-4">
                        <div className="flex items-center gap-2">
                           <Filter className="h-4 w-4 text-muted-foreground"/>
                           <span className="text-sm font-medium text-muted-foreground">Filter by:</span>
                        </div>
                        <Select value={statusFilter} onValueChange={handleFilterChange(setStatusFilter)}>
                            <SelectTrigger className="w-full sm:w-[180px]">
                                <SelectValue placeholder="Status" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Statuses</SelectItem>
                                {incidentStatusOptions.map(status => <SelectItem key={status} value={status}>{status.replace('-', ' ')}</SelectItem>)}
                            </SelectContent>
                        </Select>
                        <Select value={typeFilter} onValueChange={handleFilterChange(setTypeFilter)}>
                             <SelectTrigger className="w-full sm:w-[180px]">
                                <SelectValue placeholder="Type" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Types</SelectItem>
                                {incidentTypeOptions.map(type => <SelectItem key={type} value={type}>{type}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="min-h-[500px]">
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
                                <TableRow><TableCell colSpan={6} className="h-96 text-center"><Loader2 className="mx-auto h-8 w-8 animate-spin" /></TableCell></TableRow> 
                                ) : !incidents || incidents.length === 0 ? (
                                    <TableRow><TableCell colSpan={6} className="h-96 text-center text-muted-foreground">No incidents found for the selected filters.</TableCell></TableRow>
                                ) : incidents.map(incident => (
                                    <TableRow key={incident.id}>
                                        <TableCell>{format(incident.timestamp, 'MMM d, yyyy h:mm a')}</TableCell>
                                        <TableCell>{incident.type}</TableCell>
                                        <TableCell>{incident.reporterName || 'N/A'}</TableCell>
                                        <TableCell>{incident.targetStudentName || incident.targetStudentId || 'N/A'}</TableCell>
                                        <TableCell><Badge variant={getStatusBadgeVariant(incident.status)}>{incident.status.replace('-', ' ')}</Badge></TableCell>
                                        <TableCell className="text-right">
                                            {isUpdating === incident.id ? ( <Loader2 className="h-5 w-5 animate-spin ml-auto" /> ) : (
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" className="h-8 w-8 p-0"><span className="sr-only">Open menu</span><MoreHorizontal className="h-4 w-4" /></Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end">
                                                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                                        <DropdownMenuItem onClick={() => assignWellnessSession(incident)} disabled={!incident.targetStudentId || incident.status === 'wellness-assigned'}>
                                                            <HeartPulse className="mr-2 h-4 w-4" />Assign Wellness Session
                                                        </DropdownMenuItem>
                                                        <DropdownMenuSeparator />
                                                        <DropdownMenuItem className="text-destructive focus:bg-destructive/10 focus:text-destructive" onClick={() => setIncidentToDelete(incident)}>
                                                            <Trash2 className="mr-2 h-4 w-4" />Delete Report
                                                        </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            )}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
                <CardFooter className="flex items-center justify-between border-t pt-6">
                    <div className="text-sm text-muted-foreground">
                        Page {currentPage}
                    </div>
                    <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={goToPrevPage} disabled={currentPage === 1 || loading}>
                            <ChevronLeft className="h-4 w-4 mr-1" /> Previous
                        </Button>
                        <Button variant="outline" size="sm" onClick={goToNextPage} disabled={isLastPage || loading}>
                            Next <ChevronRight className="h-4 w-4 ml-1" />
                        </Button>
                    </div>
                </CardFooter>
            </Card>
        </>
    );
}
