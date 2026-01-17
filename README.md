# CampusConnect

CampusConnect is a modern, secure web application designed to bridge communication gaps and enhance safety within a college campus. It provides tailored experiences for students, faculty, security guards, parents, and administrators through role-based dashboards and features.

## ✨ Features

-   **Role-Based Dashboards**: Unique interfaces for Students, Faculty, Security Guards, Admins, and Parents.
-   **Incident Reporting**: Security guards can report incidents via voice transcription, which are then classified by an AI model. Students can also file confidential complaints.
-   **Session Booking**: Students can book confidential sessions with faculty members for academic guidance or grievance redressal.
-   **SOS Alerts**: Students can send an emergency SOS alert with their location to campus security.
-   **Admin Portal**: A dedicated portal for administrators to manage users, view all incident reports, and monitor campus safety.
-   **Real-time Updates**: Built with Firebase Firestore for live data synchronization across the application.
-   **Secure Authentication**: User authentication is handled by Firebase Auth, with email/password sign-in restricted to the institution's domain.

## 🚀 Getting Started

To get a local copy up and running, follow these simple steps.

### Prerequisites

-   Node.js (v18 or later)
-   npm or yarn

### Installation & Setup

1.  **Clone the repository:**
    ```sh
    git clone https://github.com/your_username/campusconnect.git
    cd campusconnect
    ```

2.  **Install NPM packages:**
    ```sh
    npm install
    ```

3.  **Set up Firebase:**
    This project is configured to work with Firebase. You will need to create a Firebase project and add your web app's configuration to the environment variables.
    - Create a `.env.local` file in the root of the project.
    - Add your Firebase configuration keys to this file:
      ```
      NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
      NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_auth_domain
      NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
      NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_storage_bucket
      NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
      NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
      ```
    - Make sure to enable **Email/Password Authentication** and **Firestore** in your Firebase project console.

4.  **Run the development server:**
    ```sh
    npm run dev
    ```

    Open [http://localhost:9002](http://localhost:9002) with your browser to see the result.

## 🛠️ Tech Stack

-   **Framework**: [Next.js](https://nextjs.org/)
-   **Styling**: [Tailwind CSS](https://tailwindcss.com/) & [ShadCN UI](https://ui.shadcn.com/)
-   **Backend & Database**: [Firebase (Firestore, Authentication, Storage)](https://firebase.google.com/)
-   **Generative AI**: [Google AI & Genkit](https://firebase.google.com/docs/genkit) for incident classification.
-   **Speech Recognition**: Web Speech API for voice-to-text transcription.
-   **Deployment**: Ready for deployment on platforms like Vercel or Firebase App Hosting.
