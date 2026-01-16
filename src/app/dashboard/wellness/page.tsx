'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { HeartPulse } from 'lucide-react';

export default function WellnessPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><HeartPulse /> Student Wellness</CardTitle>
        <CardDescription>This page is under construction. Here you will find resources and information about student wellness.</CardDescription>
      </CardHeader>
      <CardContent>
        <p>Coming soon...</p>
      </CardContent>
    </Card>
  );
}
