'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Users, CheckCircle } from 'lucide-react';

export default function InitiativesPage() {
  return (
    <Card>
        <CardHeader>
            <CardTitle className="flex items-center gap-2"><Users/> Campus Initiatives</CardTitle>
            <CardDescription>Updates on how we're making the campus safer and more inclusive.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
            <div className="flex items-start gap-4">
                <CheckCircle className="h-5 w-5 mt-1 text-accent" />
                <div>
                    <h4 className="font-semibold">New Campus Lighting Project</h4>
                    <p className="text-sm text-muted-foreground">Completed the installation of 50 new LED lights in parking lots and walkways.</p>
                </div>
            </div>
            <div className="flex items-start gap-4">
                <CheckCircle className="h-5 w-5 mt-1 text-accent" />
                <div>
                    <h4 className="font-semibold">Mental Wellness Workshops</h4>
                    <p className="text-sm text-muted-foreground">Launched a new series of workshops on stress management and mental health awareness.</p>
                </div>
            </div>
            <div className="flex items-start gap-4">
                <CheckCircle className="h-5 w-5 mt-1 text-accent" />
                <div>
                    <h4 className="font-semibold">Enhanced Guard Training</h4>
                    <p className="text-sm text-muted-foreground">All security personnel have completed advanced de-escalation and cultural sensitivity training.</p>
                </div>
            </div>
        </CardContent>
    </Card>
  );
}
