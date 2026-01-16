'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { BarChart3 } from 'lucide-react';

export default function StudentBehaviorPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><BarChart3 /> Behavioral Trends</CardTitle>
        <CardDescription>This page is under construction. Here you will see analytics on student behavior.</CardDescription>
      </CardHeader>
      <CardContent>
        <p>Coming soon...</p>
      </CardContent>
    </Card>
  );
}
