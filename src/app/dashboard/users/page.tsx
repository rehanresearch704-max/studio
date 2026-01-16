'use client';
import { useState } from 'react';
import { collection, query, doc, updateDoc } from 'firebase/firestore';
import { UserProfile, UserRole } from '@/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Loader2, Users, ShieldCheck } from 'lucide-react';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export default function UserManagementPage() {
  const firestore = useFirestore();
  const { user: adminUser } = useAuth();
  const { toast } = useToast();
  const [isUpdating, setIsUpdating] = useState<string | null>(null);

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

  const roleOptions: UserRole[] = ['admin', 'student', 'faculty', 'guard', 'parent', 'visitor'];

  return (
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
                <TableHead>Current Role</TableHead>
                <TableHead className="text-right">Change Role</TableHead>
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
                      <div className="flex justify-end"><Loader2 className="h-5 w-5 animate-spin" /></div>
                    ) : (
                      <Select
                        defaultValue={user.role}
                        onValueChange={(newRole) => handleRoleChange(user.uid, newRole as UserRole)}
                        disabled={user.uid === adminUser?.uid}
                      >
                        <SelectTrigger className="w-[180px] ml-auto">
                          <SelectValue placeholder="Select new role" />
                        </SelectTrigger>
                        <SelectContent>
                          {roleOptions.map(role => (
                            <SelectItem key={role} value={role}>
                              {role.charAt(0).toUpperCase() + role.slice(1)}
                            </Item>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
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
