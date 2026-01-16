'use client';
import { useState, useEffect } from 'react';
import { APIProvider, Map, AdvancedMarker } from '@vis.gl/react-google-maps';
import { collection, onSnapshot, QuerySnapshot, DocumentData } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Incident } from '@/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Loader2, ShieldAlert } from 'lucide-react';

export default function IncidentHeatmap() {
    const [incidents, setIncidents] = useState<Incident[]>([]);
    const [loading, setLoading] = useState(true);
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

    useEffect(() => {
        const unsubscribe = onSnapshot(collection(db, 'incidents'), (snapshot: QuerySnapshot<DocumentData>) => {
            const incidentsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Incident));
            setIncidents(incidentsData);
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    if (!apiKey) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Map Configuration Error</CardTitle>
                </CardHeader>
                <CardContent>
                    <p>The Google Maps API key is missing. Please add it to your environment variables to display the incident map.</p>
                </CardContent>
            </Card>
        );
    }
    
    if (loading) {
        return <div className="flex items-center justify-center p-8"><Loader2 className="h-8 w-8 animate-spin" /> <span className="ml-2">Loading map data...</span></div>
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Campus Incident Hotspots</CardTitle>
                <CardDescription>Visualizing reported incidents to identify areas of concern.</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="h-[500px] w-full rounded-lg overflow-hidden">
                    <APIProvider apiKey={apiKey}>
                        <Map
                            defaultCenter={{ lat: 17.2942, lng: 78.4728 }} // Default to a central campus location
                            defaultZoom={15}
                            mapId="campus-guardian-map"
                        >
                            {incidents.map(incident => (
                                incident.location &&
                                <AdvancedMarker 
                                    key={incident.id} 
                                    position={{ lat: incident.location.latitude, lng: incident.location.longitude }}
                                    title={`Type: ${incident.type}`}
                                >
                                  <ShieldAlert className="text-red-500 h-6 w-6" />
                                </AdvancedMarker>
                            ))}
                        </Map>
                    </APIProvider>
                </div>
            </CardContent>
        </Card>
    );
}
