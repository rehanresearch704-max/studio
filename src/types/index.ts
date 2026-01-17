import type { Timestamp, GeoPoint } from 'firebase/firestore';

export type UserRole = 'student' | 'guard' | 'admin' | 'faculty' | 'parent' | 'visitor';

export interface UserProfile {
  uid: string;
  name: string;
  email: string;
  role: UserRole;
  department?: string;
  languagePreference?: string;
  childrenUids?: string[];
  availability?: string;
  mobileNumber?: string;
}

export type IncidentType = 'Verbal Abuse' | 'Intimidation' | 'Micro-aggressions' | 'Other';
export type IncidentStatus = 'reported' | 'in-progress' | 'resolved' | 'wellness-assigned';

export interface Incident {
  id?: string;
  timestamp: Timestamp;
  type: IncidentType;
  audioTranscript?: string;
  location: GeoPoint;
  status: IncidentStatus;
  reporterId: string;
  reporterName: string;
  targetStudentId?: string;
  targetStudentName?: string;
  voiceRecordingUrl?: string;
  mediaUrls?: string[];
}

export type AppointmentType = 'Academic Guidance' | 'Grievance Redressal' | 'Mentorship' | 'Wellness Session';
export type AppointmentStatus = 'pending' | 'approved' | 'completed' | 'rescheduled';

export interface Appointment {
  id?: string;
  studentId: string;
  studentName: string;
  staffId: string;
  staffName: string;
  type: AppointmentType;
  time: Timestamp;
  notes?: string;
  status: AppointmentStatus;
}

export interface SosAlert {
  id?: string;
  uid: string;
  userName: string;
  coords: GeoPoint;
  timestamp: Timestamp;
  activeStatus: boolean;
}

export interface GuestLog {
  id?: string;
  name: string;
  purpose: string;
  checkInTime: Timestamp;
}
