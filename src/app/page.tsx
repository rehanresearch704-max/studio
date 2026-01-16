'use client';

import Image from 'next/image';
import Link from 'next/link';
import { ShieldCheck, Loader2 } from 'lucide-react';

import { LoginForm } from '@/components/auth/login-form';
import { SignupForm } from '@/components/auth/signup-form';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { useAuth } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function LoginPage() {
  const loginImage = PlaceHolderImages.find(p => p.id === 'login-background');
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (user) {
      router.push('/dashboard');
    }
  }, [user, router]);

  if (loading || user) {
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
          CampusConnect
        </div>
        <div className="relative z-20 mt-auto">
          <blockquote className="space-y-2">
            <p className="text-2xl font-headline">
              &ldquo;A truly connected campus is a safer, more supportive
              environment for everyone. We are building the tools to make that a
              reality.&rdquo;
            </p>
            <footer className="text-md font-sans">The HITAM Project</footer>
          </blockquote>
        </div>
      </div>
      <div className="flex items-center justify-center py-12">
        <div className="mx-auto grid w-[350px] gap-6 animate-in fade-in-90 slide-in-from-top-4 duration-1000">
          <Tabs defaultValue="login" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login">Login</TabsTrigger>
              <TabsTrigger value="signup">Sign Up</TabsTrigger>
            </TabsList>
            <TabsContent value="login">
                <div className="grid gap-2 text-center pt-6 pb-4">
                    <h1 className="font-headline text-3xl font-bold">Welcome Back</h1>
                    <p className="text-balance text-muted-foreground">
                    Sign in to access your dashboard
                    </p>
                </div>
                <LoginForm />
            </TabsContent>
            <TabsContent value="signup">
                <div className="grid gap-2 text-center pt-6 pb-4">
                    <h1 className="font-headline text-3xl font-bold">Create an Account</h1>
                    <p className="text-balance text-muted-foreground">
                    Join the community to get started
                    </p>
                </div>
                <SignupForm />
            </TabsContent>
          </Tabs>
          <div className="mt-4 text-center text-sm">
            <Link href="/admin" className="underline hover:text-primary">
              Admin Portal
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
