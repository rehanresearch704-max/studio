import type { UserProfile } from '@/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { BookUser } from 'lucide-react';

export default function VisitorDashboard({ userProfile }: { userProfile: UserProfile }) {
    const router = useRouter();

    return (
        <div className="flex items-center justify-center h-full">
            <Card className="w-full max-w-lg text-center">
                <CardHeader>
                    <CardTitle className="font-headline text-3xl">Welcome, Visitor!</CardTitle>
                    <CardDescription>
                        To ensure campus security and a smooth visit, please check in using our digital guest log.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Button size="lg" onClick={() => router.push('/check-in')}>
                        <BookUser className="mr-2 h-5 w-5" />
                        Go to Digital Check-in
                    </Button>
                </CardContent>
            </Card>
        </div>
    );
}
