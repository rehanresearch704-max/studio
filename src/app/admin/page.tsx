'use client';

import Image from 'next/image';
import { ShieldCheck, Loader2 } from 'lucide-react';
import { AdminLoginForm } from '@/components/auth/admin-login-form';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { useAuth } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function AdminLoginPage() {
  const loginImage = PlaceHolderImages.find(p => p.id === 'login-background');
  const { user, loading, userProfile } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (user && userProfile) {
      if (userProfile.role === 'admin') {
        router.push('/dashboard');
      }
    }
  }, [user, userProfile, router]);

  if (loading || (user && userProfile?.role === 'admin')) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="h-screen w-full lg:grid lg:min-h-[600px] lg:grid-cols-2 xl:min-h-[800px]">
      <div className="relative hidden h-full flex-col bg-muted p-10 text-white dark:border-r lg:flex">
        <div className="absolute inset-0 bg-primary" />
        {loginImage && (
            <Image
                src={loginImage.imageUrl}
                alt={loginImage.description}
                fill
                className="object-cover opacity-20"
                data-ai-hint={loginImage.imageHint}
            />
        )}
        <div className="relative z-20 flex items-center text-lg font-medium">
          <ShieldCheck className="mr-2 h-8 w-8" />
          CampusConnect - Admin Portal
        </div>
        <div className="relative z-20 mt-auto">
          <blockquote className="space-y-2">
            <p className="text-2xl font-headline">
              &ldquo;With great power comes great responsibility. Manage the campus community with care and diligence.&rdquo;
            </p>
            <footer className="text-md font-sans">The HITAM Project</footer>
          </blockquote>
        </div>
      </div>
      <div className="flex items-center justify-center py-12">
        <div className="mx-auto grid w-[350px] gap-6">
          <div className="grid gap-2 text-center">
            <h1 className="font-headline text-3xl font-bold">Admin Login</h1>
            <p className="text-balance text-muted-foreground">
              Enter your credentials to access the admin dashboard
            </p>
          </div>
          <AdminLoginForm />
        </div>
      </div>
    </div>
  );
}
