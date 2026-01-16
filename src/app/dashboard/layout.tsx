'use client';
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarTrigger,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarInset,
  SidebarFooter,
} from '@/components/ui/sidebar';
import { useRouter, usePathname } from 'next/navigation';
import {
  Shield,
  LayoutDashboard,
  CalendarCheck,
  Map,
  Users,
  BookUser,
  LogOut,
  Settings,
  ShieldCheck,
  Mic,
  BarChart3,
  HeartPulse,
  Siren
} from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { signOut } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import React from 'react';

const getInitials = (name: string) => {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase();
};

const UserNav = () => {
    const { user, userProfile } = useAuth();
    const router = useRouter();

    const handleSignOut = async () => {
        await signOut(auth);
        router.push('/');
    };

    if (!user || !userProfile) {
        return null;
    }

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                    <Avatar className="h-8 w-8">
                        <AvatarImage src={user.photoURL || undefined} alt={userProfile.name} />
                        <AvatarFallback>{getInitials(userProfile.name)}</AvatarFallback>
                    </Avatar>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                        <p className="text-sm font-medium leading-none">{userProfile.name}</p>
                        <p className="text-xs leading-none text-muted-foreground">
                            {user.email}
                        </p>
                    </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuGroup>
                    <DropdownMenuItem>
                        <Settings className="mr-2 h-4 w-4" />
                        <span>Settings</span>
                    </DropdownMenuItem>
                </DropdownMenuGroup>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSignOut}>
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Log out</span>
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    )
}

const navItems = {
    admin: [
        { href: '/dashboard', icon: LayoutDashboard, label: 'Overview' },
        { href: '/dashboard/incidents-map', icon: Map, label: 'Incidents Map' },
        { href: '/dashboard/manage-incidents', icon: Shield, label: 'Manage Incidents' },
        { href: '/dashboard/users', icon: Users, label: 'User Management' },
    ],
    student: [
        { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
        { href: '/dashboard/book-session', icon: CalendarCheck, label: 'Book Session' },
        { href: '/dashboard/my-sessions', icon: BarChart3, label: 'My Sessions' },
        { href: '/dashboard/wellness', icon: HeartPulse, label: 'Wellness' },
    ],
    guard: [
        { href: '/dashboard', icon: Mic, label: 'Report Incident' },
        { href: '/dashboard/past-reports', icon: Shield, label: 'Past Reports' },
    ],
    faculty: [
        { href: '/dashboard', icon: CalendarCheck, label: 'Session Requests' },
        { href: '/dashboard/student-behavior', icon: BarChart3, label: 'Behavioral Trends' },
    ],
    parent: [
        { href: '/dashboard', icon: ShieldCheck, label: 'Safety Score' },
        { href: '/dashboard/initiatives', icon: Users, label: 'Campus Initiatives' },
    ],
    visitor: [
        { href: '/check-in', icon: BookUser, label: 'Digital Guest Log' }
    ]
};

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { userProfile } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [open, setOpen] = React.useState(true);

  const currentNavItems = userProfile ? navItems[userProfile.role] : [];

  return (
    <SidebarProvider open={open} onOpenChange={setOpen}>
        <Sidebar>
            <SidebarHeader>
                <div className="flex items-center gap-2">
                    <ShieldCheck className="size-6 text-primary" />
                    <h1 className="font-headline text-xl font-semibold">CampusConnect</h1>
                </div>
            </SidebarHeader>
            <SidebarContent>
                <SidebarMenu>
                    {currentNavItems.map((item) => (
                        <SidebarMenuItem key={item.href}>
                            <SidebarMenuButton 
                                onClick={() => router.push(item.href)}
                                isActive={pathname === item.href}
                                tooltip={item.label}
                            >
                                <item.icon />
                                <span>{item.label}</span>
                            </SidebarMenuButton>
                        </SidebarMenuItem>
                    ))}
                </SidebarMenu>
            </SidebarContent>
            <SidebarFooter>
                 <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton onClick={async () => {
                             await signOut(auth);
                             router.push('/');
                        }}>
                            <LogOut />
                            <span>Logout</span>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                 </SidebarMenu>
            </SidebarFooter>
        </Sidebar>
        <SidebarInset className="flex flex-col">
            <header className="sticky top-0 z-10 flex h-14 items-center justify-between gap-4 border-b bg-background/80 px-4 backdrop-blur-sm sm:h-16 sm:px-8">
                <SidebarTrigger />
                <UserNav />
            </header>
            <main className="flex-1 overflow-auto p-4 sm:p-8">
                 {children}
            </main>
        </SidebarInset>
    </SidebarProvider>
  );
}
