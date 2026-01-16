'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Users } from 'lucide-react';

export default function UserManagementPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><Users /> User Management</CardTitle>
        <CardDescription>This page is under construction. Here you will be able to manage all users.</CardDescription>
      </CardHeader>
      <CardContent>
        <p>Coming soon...</p>
      </CardContent>
    </Card>
  );
}
