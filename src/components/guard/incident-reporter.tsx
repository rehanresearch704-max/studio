'use client';
import { useState } from 'react';
import { Mic, MicOff, Send, Loader2, Languages, Eraser, User, Paperclip, Camera } from 'lucide-react';
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
import { db, storage } from '@/lib/firebase';
import { Incident } from '@/types';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { v4 as uuidv4 } from 'uuid';
import { Progress } from '../ui/progress';


const createIncidentReport = async (
    transcript: string, 
    guardId: string, 
    location: GeoPoint | null, 
    voiceUrl: string | undefined,
    mediaUrls: string[],
    targetStudentId?: string
): Promise<void> => {
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
        voiceRecordingUrl: voiceUrl,
        mediaUrls: mediaUrls
    };
    await addDoc(collection(db, 'incidents'), newIncident);
};


export default function IncidentReporter({ guardId }: { guardId: string }) {
  const { transcript, isListening, startListening, stopListening, isSupported, error, clearTranscript } = useSpeechRecognition();
  const [language, setLanguage] = useState('en-US');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const { toast } = useToast();
  const [currentTranscript, setCurrentTranscript] = useState('');
  const [targetStudentId, setTargetStudentId] = useState('');
  const [voiceFile, setVoiceFile] = useState<File | null>(null);
  const [mediaFiles, setMediaFiles] = useState<FileList | null>(null);

  const handleToggleListening = () => {
    if (isListening) {
      stopListening();
      setCurrentTranscript(prev => prev + transcript);
    } else {
      clearTranscript();
      startListening(language);
    }
  };

  const uploadFile = async (file: File, path: string): Promise<string> => {
    const storageRef = ref(storage, path);
    await uploadBytes(storageRef, file);
    return getDownloadURL(storageRef);
  };
  
  const handleSubmit = async () => {
    const finalTranscript = currentTranscript + transcript;
    if (!finalTranscript.trim()) {
        toast({ variant: 'destructive', title: 'Error', description: 'Cannot submit an empty report.' });
        return;
    }
    setIsSubmitting(true);
    setUploadProgress(0);
    
    navigator.geolocation.getCurrentPosition(
        async (position) => {
            const location = new GeoPoint(position.coords.latitude, position.coords.longitude);
            try {
                let voiceRecordingUrl: string | undefined = undefined;
                let mediaUrls: string[] = [];
                const totalFiles = (voiceFile ? 1 : 0) + (mediaFiles?.length || 0);
                let filesUploaded = 0;

                if (voiceFile) {
                    const filePath = `incidents/${uuidv4()}-${voiceFile.name}`;
                    voiceRecordingUrl = await uploadFile(voiceFile, filePath);
                    filesUploaded++;
                    setUploadProgress((filesUploaded / totalFiles) * 100);
                }

                if (mediaFiles && mediaFiles.length > 0) {
                    for (const file of Array.from(mediaFiles)) {
                      const filePath = `incidents/${uuidv4()}-${file.name}`;
                      const url = await uploadFile(file, filePath);
                      mediaUrls.push(url);
                      filesUploaded++;
                      setUploadProgress((filesUploaded / totalFiles) * 100);
                    }
                }

                await createIncidentReport(finalTranscript, guardId, location, voiceRecordingUrl, mediaUrls, targetStudentId);
                toast({ title: 'Success', description: 'Incident report submitted and classified.' });
                setCurrentTranscript('');
                setTargetStudentId('');
                setVoiceFile(null);
                setMediaFiles(null);
                clearTranscript();
            } catch (err: any) {
                toast({ variant: 'destructive', title: 'Submission Failed', description: err.message });
            } finally {
                setIsSubmitting(false);
                setUploadProgress(0);
            }
        },
        async (error) => {
            toast({ variant: 'destructive', title: 'Location Error', description: 'Could not get location. Submitting without location data.' });
             try {
                // Duplicating upload logic for the error path
                let voiceRecordingUrl: string | undefined = undefined;
                let mediaUrls: string[] = [];
                if (voiceFile) voiceRecordingUrl = await uploadFile(voiceFile, `incidents/${uuidv4()}-${voiceFile.name}`);
                if (mediaFiles) {
                    for (const file of Array.from(mediaFiles)) {
                        mediaUrls.push(await uploadFile(file, `incidents/${uuidv4()}-${file.name}`));
                    }
                }
                
                await createIncidentReport(finalTranscript, guardId, null, voiceRecordingUrl, mediaUrls, targetStudentId);
                toast({ title: 'Success', description: 'Incident report submitted and classified.' });
                setCurrentTranscript('');
                setTargetStudentId('');
                setVoiceFile(null);
                setMediaFiles(null);
                clearTranscript();
            } catch (err: any) {
                toast({ variant: 'destructive', title: 'Submission Failed', description: err.message });
            } finally {
                setIsSubmitting(false);
                setUploadProgress(0);
            }
        }
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>V.U.I. Reporting Engine</CardTitle>
        <CardDescription>
          Press the microphone to start/stop recording. Your speech will be transcribed below. You can also attach media evidence.
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

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
                 <Label className="flex items-center gap-2 text-sm text-muted-foreground mb-2"><Paperclip className="h-4 w-4" /> Attach Voice Memo</Label>
                 <Input type="file" accept="audio/*" onChange={(e) => setVoiceFile(e.target.files ? e.target.files[0] : null)} disabled={isSubmitting} />
            </div>
            <div>
                <Label className="flex items-center gap-2 text-sm text-muted-foreground mb-2"><Camera className="h-4 w-4" /> Attach Photos/Videos</Label>
                <Input type="file" accept="image/*,video/*" multiple onChange={(e) => setMediaFiles(e.target.files)} disabled={isSubmitting} />
            </div>
        </div>
        
        {isSubmitting && <Progress value={uploadProgress} className="w-full" />}
        
        <div className="flex justify-end">
            <Button onClick={handleSubmit} disabled={isSubmitting || (!currentTranscript && !transcript)}>
                {isSubmitting ? (
                    <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Submitting... {uploadProgress.toFixed(0)}%
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
