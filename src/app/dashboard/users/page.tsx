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
    setIsUpdating(uid);
    try {
      if (!firestore) throw new Error("Firestore not available");
      const userDocRef = doc(firestore, 'users', uid);
      await updateDoc(userDocRef, { role: newRole });
      toast({
        title: 'Role Updated',
        description: `User role has been successfully changed to ${newRole}.`,
      });
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Update Failed',
        description: error.message || 'Could not update user role.',
      });
    } finally {
      setIsUpdating(null);
    }
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
    setIsUpdating(userToDelete.uid);
    try {
      await deleteDoc(doc(firestore, 'users', userToDelete.uid));
      toast({
        title: 'User Deleted',
        description: `The user ${userToDelete.name} has been deleted. Note: this only removes their app data, not their login.`,
      });
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Deletion Failed',
        description: error.message || 'An error occurred while deleting the user.',
      });
    } finally {
      setUserToDelete(null);
      setIsUpdating(null);
    }
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
