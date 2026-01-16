'use client';
import { useState } from 'react';
import { Mic, MicOff, Send, Loader2, Languages, Eraser, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useSpeechRecognition } from '@/hooks/use-speech-recognition';
import { useToast } from '@/hooks/use-toast';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { classifyIncidentType } from '@/ai/flows/classify-incident-type';
import { addDoc, collection, serverTimestamp, GeoPoint } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Incident } from '@/types';
import { Input } from '../ui/input';
import { Label } from '../ui/label';


const createIncidentReport = async (transcript: string, guardId: string, location: GeoPoint | null, targetStudentId?: string): Promise<void> => {
    if (!transcript) {
        throw new Error("Transcript is empty.");
    }
    const classification = await classifyIncidentType({ audioTranscript: transcript });
    
    const newIncident: Omit<Incident, 'id'> = {
        timestamp: serverTimestamp() as any,
        type: classification.incidentType,
        audioTranscript: transcript,
        location: location || new GeoPoint(0,0), // Fallback location
        status: 'reported',
        reporterId: guardId,
        reporterName: 'Campus Security',
        targetStudentId: targetStudentId || undefined,
        // targetStudentName will need to be populated by an admin or a backend function
    };
    await addDoc(collection(db, 'incidents'), newIncident);
};


export default function IncidentReporter({ guardId }: { guardId: string }) {
  const { transcript, isListening, startListening, stopListening, isSupported, error, clearTranscript } = useSpeechRecognition();
  const [language, setLanguage] = useState('en-US');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const [currentTranscript, setCurrentTranscript] = useState('');
  const [targetStudentId, setTargetStudentId] = useState('');

  const handleToggleListening = () => {
    if (isListening) {
      stopListening();
      // The transcript state update is handled by the hook, but let's merge it to be safe
      setCurrentTranscript(prev => prev + transcript);
    } else {
      clearTranscript();
      startListening(language);
    }
  };
  
  const handleSubmit = async () => {
    const finalTranscript = currentTranscript + transcript;
    if (!finalTranscript.trim()) {
        toast({ variant: 'destructive', title: 'Error', description: 'Cannot submit an empty report.' });
        return;
    }
    setIsSubmitting(true);
    
    navigator.geolocation.getCurrentPosition(
        async (position) => {
            const location = new GeoPoint(position.coords.latitude, position.coords.longitude);
            try {
                await createIncidentReport(finalTranscript, guardId, location, targetStudentId);
                toast({ title: 'Success', description: 'Incident report submitted and classified.' });
                setCurrentTranscript('');
                setTargetStudentId('');
                clearTranscript();
            } catch (err: any) {
                toast({ variant: 'destructive', title: 'Submission Failed', description: err.message });
            } finally {
                setIsSubmitting(false);
            }
        },
        async (error) => {
            toast({ variant: 'destructive', title: 'Location Error', description: 'Could not get location. Submitting without location data.' });
             try {
                await createIncidentReport(finalTranscript, guardId, null, targetStudentId);
                toast({ title: 'Success', description: 'Incident report submitted and classified.' });
                setCurrentTranscript('');
                setTargetStudentId('');
                clearTranscript();
            } catch (err: any) {
                toast({ variant: 'destructive', title: 'Submission Failed', description: err.message });
            } finally {
                setIsSubmitting(false);
            }
        }
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>V.U.I. Reporting Engine</CardTitle>
        <CardDescription>
          Press the microphone to start/stop recording. Your speech will be transcribed below.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-col sm:flex-row items-center gap-4">
            <Button
              size="icon"
              className={`h-24 w-24 rounded-full transition-all duration-300 ${isListening ? 'bg-red-500 hover:bg-red-600 animate-pulse' : 'bg-primary hover:bg-primary/90'}`}
              onClick={handleToggleListening}
              disabled={!isSupported || isSubmitting}
            >
              {isListening ? <MicOff className="h-12 w-12" /> : <Mic className="h-12 w-12" />}
            </Button>

            <div className="w-full sm:w-auto flex-grow space-y-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Languages className="h-4 w-4" />
                    <span>Select Reporting Language</span>
                </div>
                <Select value={language} onValuechange={setLanguage} disabled={isListening}>
                    <SelectTrigger>
                        <SelectValue placeholder="Select language" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="en-US">English (US)</SelectItem>
                        <SelectItem value="hi-IN">Hindi (हिन्दी)</SelectItem>
                        <SelectItem value="te-IN">Telugu (తెలుగు)</SelectItem>
                        <SelectItem value="ur-PK">Urdu (اردو)</SelectItem>
                    </SelectContent>
                </Select>
                 {error && <p className="text-xs text-destructive">{error}</p>}
                 {!isSupported && <p className="text-xs text-destructive">Speech recognition not supported in this browser.</p>}
            </div>
        </div>

        <div className="grid gap-2">
          <Label htmlFor='target-student-id' className="flex items-center gap-2 text-sm text-muted-foreground"><User className="h-4 w-4" /> Involved Student ID (Optional)</Label>
          <Input id='target-student-id' placeholder='Enter the student ID if known' value={targetStudentId} onChange={(e) => setTargetStudentId(e.target.value)} disabled={isSubmitting}/>
        </div>

        <div className="relative">
          <Textarea
            placeholder="Your transcribed report will appear here..."
            className="min-h-[150px] pr-10"
            value={currentTranscript + transcript}
            onChange={(e) => setCurrentTranscript(e.target.value)}
            readOnly={isListening}
          />
           <Button variant="ghost" size="icon" className="absolute top-2 right-2 text-muted-foreground" onClick={() => {
               setCurrentTranscript('');
               clearTranscript();
           }}>
              <Eraser className="h-4 w-4" />
          </Button>
        </div>
        
        <div className="flex justify-end">
            <Button onClick={handleSubmit} disabled={isSubmitting || (!currentTranscript && !transcript)}>
                {isSubmitting ? (
                    <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Submitting...
                    </>
                ) : (
                    <>
                        <Send className="mr-2 h-4 w-4" />
                        Submit Report
                    </>
                )}
            </Button>
        </div>
      </CardContent>
    </Card>
  );
}

    