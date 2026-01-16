# **App Name**: CampusConnect

## Core Features:

- User Authentication and Role-Based Routing: Authenticate users via Firebase, determine role from Firestore 'users' collection, and route to the appropriate dashboard (security guard, student, administrator, faculty, parent/visitor).
- Security Guard VUI Reporting: Enable security guards to report incidents using voice input via the Web Speech API, supporting Telugu, Urdu, and Hindi. Anonymize reports by hashing guard IDs. The AI will decide if Verbal Abuse, Intimidation, or Micro-aggressions needs to be flagged as part of the report through a tool. The tool helps classify incidents automatically.
- Student Faculty/In-charge Session Booking: Allow students to book sessions with faculty and in-charges for academic guidance, grievance redressal, or mentorship. Provide real-time status updates (Pending/Approved/Completed).
- Emergency SOS: Implement a persistent red Floating Action Button (FAB) that captures the student's location (navigator.geolocation) and alerts nearby guards and administrators.
- Administrator Spatial Heatmaps: Visualize incident coordinates on a map to identify hotspots of friction on campus. Incidents are retrieved from the 'incidents' collection in Firestore.
- Wellness-Security Nexus: Enable administrators to flag students involved in reported incidents for mandatory wellness sessions.
- Digital Guest Log: Replace manual visitor logs with a check-in UI that captures the visitor's purpose of visit.

## Style Guidelines:

- Primary color: #3B82F6 (Strong Blue), chosen to project trust and security in alignment with the app's protective function.
- Background color: #E5E7EB (Light Gray), a desaturated version of the primary color, ensuring a clean and non-distracting backdrop.
- Accent color: #4ADE80 (Vibrant Green), analogous to the primary but contrasting significantly in brightness and saturation to draw attention to calls to action and positive feedback.
- Font pairing: 'Space Grotesk' (sans-serif) for headlines to convey a modern and tech-forward feel, paired with 'Inter' (sans-serif) for body text to ensure readability.
- Use clear and concise icons from a library like FontAwesome or Material Icons to represent different incident types, user roles, and actions.
- Implement a responsive layout using Tailwind CSS to ensure the app is accessible and usable on various devices (desktops, tablets, and smartphones). Add the provided image on the main login page
- Use subtle animations for transitions and loading states to enhance the user experience without being distracting.