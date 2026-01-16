'use client';

import IncidentHeatmap from '@/components/admin/incident-heatmap';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy } from 'firebase/firestore';
import type { Incident } from '@/types';

export default function IncidentsMapPage() {
  const firestore = useFirestore();

  const incidentsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'incidents'), orderBy('timestamp', 'desc'));
  }, [firestore]);

  const { data: rawIncidents, isLoading: incidentsLoading } = useCollection<Incident>(incidentsQuery);

  const incidents = rawIncidents
    ? rawIncidents.map(inc => ({
        ...inc,
        timestamp: (inc.timestamp as any)?.toDate ? (inc.timestamp as any).toDate() : new Date(),
      }))
    : [];
    
  return <IncidentHeatmap incidents={incidents} isLoading={incidentsLoading} />;
}
