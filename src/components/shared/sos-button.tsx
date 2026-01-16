'use client';

import { useState } from 'react';
import { Siren, Loader2 } from 'lucide-react';
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
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import { addDoc, collection, serverTimestamp, GeoPoint } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export default function SOSButton() {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const { user, userProfile } = useAuth();

  const handleSOS = () => {
    if (!navigator.geolocation) {
      toast({
        variant: 'destructive',
        title: 'Geolocation not supported',
        description: 'Your browser does not support location services.',
      });
      return;
    }

    setIsLoading(true);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          if (!user || !userProfile) throw new Error('User not authenticated');
          
          await addDoc(collection(db, 'sos_alerts'), {
            uid: user.uid,
            userName: userProfile.name,
            coords: new GeoPoint(position.coords.latitude, position.coords.longitude),
            timestamp: serverTimestamp(),
            activeStatus: true,
          });

          toast({
            title: 'SOS Alert Sent!',
            description: 'Your location has been sent to security and administrators. Help is on the way.',
          });
        } catch (error: any) {
          toast({
            variant: 'destructive',
            title: 'Failed to send SOS',
            description: error.message || 'An unexpected error occurred.',
          });
        } finally {
          setIsLoading(false);
          setIsOpen(false);
        }
      },
      (error) => {
        toast({
          variant: 'destructive',
          title: 'Could not get location',
          description: error.message || 'Please ensure location services are enabled for this site.',
        });
        setIsLoading(false);
      }
    );
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
      <AlertDialogTrigger asChild>
        <Button
          variant="destructive"
          size="icon"
          className="fixed bottom-8 right-8 h-16 w-16 rounded-full shadow-2xl animate-pulse"
        >
          <Siren className="h-8 w-8" />
          <span className="sr-only">Emergency SOS</span>
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Confirm Emergency SOS</AlertDialogTitle>
          <AlertDialogDescription>
            This will immediately send your current location to campus security and administrators. Only use this in a genuine emergency.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isLoading}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleSOS}
            disabled={isLoading}
            className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Sending...
              </>
            ) : (
              'Confirm SOS'
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
