'use client';
import { useState } from 'react';
import { collection, query, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { UserProfile, UserRole } from '@/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Loader2, Users, ShieldCheck, MoreHorizontal, Trash2 } from 'lucide-react';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
  DropdownMenuPortal,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
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
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

export default function UserManagementPage() {
  const firestore = useFirestore();
  const { user: adminUser } = useAuth();
  const { toast } = useToast();
  const [isUpdating, setIsUpdating] = useState<string | null>(null);
  const [userToDelete, setUserToDelete] = useState<UserProfile | null>(null);

  const usersQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'users'));
  }, [firestore]);

  const { data: users, isLoading: loading } = useCollection<UserProfile>(usersQuery);

  const handleRoleChange = async (uid: string, newRole: UserRole) => {
    if (uid === adminUser?.uid) {
      toast({
        variant: 'destructive',
        title: 'Action Forbidden',
        description: "You cannot change your own role.",
      });
      return;
    }
    if (!firestore) {
        toast({ variant: 'destructive', title: 'Error', description: 'Database connection not available.' });
        return;
    }

    setIsUpdating(uid);
    const userDocRef = doc(firestore, 'users', uid);

    updateDoc(userDocRef, { role: newRole })
        .then(() => {
            toast({
                title: 'Role Updated',
                description: `User role has been successfully changed to ${newRole}.`,
            });
        })
        .catch((serverError) => {
            errorEmitter.emit('permission-error', new FirestorePermissionError({
                path: userDocRef.path,
                operation: 'update',
                requestResourceData: { role: newRole },
            }));
        })
        .finally(() => {
            setIsUpdating(null);
        });
  };
  
  const handleDeleteUser = async () => {
    if (!userToDelete || !firestore) return;
    if (userToDelete.uid === adminUser?.uid) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'You cannot delete your own account.',
      });
      setUserToDelete(null);
      return;
    }
    
    const userDocRef = doc(firestore, 'users', userToDelete.uid);
    setIsUpdating(userToDelete.uid);

    deleteDoc(userDocRef)
        .then(() => {
            toast({
                title: 'User Deleted',
                description: `The user ${userToDelete.name} has been deleted. Note: this only removes their app data, not their login.`,
            });
        })
        .catch((serverError) => {
            errorEmitter.emit('permission-error', new FirestorePermissionError({
                path: userDocRef.path,
                operation: 'delete',
            }));
        })
        .finally(() => {
            setUserToDelete(null);
            setIsUpdating(null);
        });
  };


  const roleOptions: UserRole[] = ['admin', 'student', 'faculty', 'guard', 'parent', 'visitor'];

  return (
    <>
      <AlertDialog open={!!userToDelete} onOpenChange={(open) => !open && setUserToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the user profile for <span className="font-bold">{userToDelete?.name}</span>.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isUpdating === userToDelete?.uid}>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteUser} 
              disabled={isUpdating === userToDelete?.uid}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isUpdating === userToDelete?.uid && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Delete User
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Users /> User Management</CardTitle>
          <CardDescription>View and manage user roles across the application.</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center p-8"><Loader2 className="h-8 w-8 animate-spin" /></div>
          ) : !users || users.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">
              <Users className="mx-auto h-12 w-12"/>
              <p className="mt-4">No users found.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map(user => (
                  <TableRow key={user.uid}>
                    <TableCell className="font-medium">{user.name}{user.uid === adminUser?.uid && <span className="text-muted-foreground"> (You)</span>}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>
                      <Badge variant={user.role === 'admin' ? 'destructive' : 'secondary'}>
                        {user.role === 'admin' && <ShieldCheck className="mr-1 h-3 w-3" />}
                        {user.role}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      {isUpdating === user.uid ? (
                        <Loader2 className="h-5 w-5 animate-spin ml-auto" />
                      ) : (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0" disabled={user.uid === adminUser?.uid}>
                              <span className="sr-only">Open menu</span>
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuSub>
                              <DropdownMenuSubTrigger>Change Role</DropdownMenuSubTrigger>
                              <DropdownMenuPortal>
                                <DropdownMenuSubContent>
                                  {roleOptions.map(role => (
                                    <DropdownMenuItem key={role} onClick={() => handleRoleChange(user.uid, role)}>
                                      {role.charAt(0).toUpperCase() + role.slice(1)}
                                    </DropdownMenuItem>
                                  ))}
                                </DropdownMenuSubContent>
                              </DropdownMenuPortal>
                            </DropdownMenuSub>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="text-destructive focus:bg-destructive/10 focus:text-destructive" onClick={() => setUserToDelete(user)}>
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete User
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </>
  );
}
