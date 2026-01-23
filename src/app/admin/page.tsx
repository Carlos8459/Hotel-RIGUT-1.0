'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUser, useFirestore, useCollection, useDoc, useMemoFirebase } from '@/firebase';
import { collection, query, doc } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { UserList } from '@/components/admin/user-list';
import { Skeleton } from '@/components/ui/skeleton';

export default function AdminPage() {
    const { user, isUserLoading } = useUser();
    const router = useRouter();
    const firestore = useFirestore();

    // Admin Check
    const adminRoleRef = useMemoFirebase(() => {
        if (!firestore || !user?.uid) return null;
        return doc(firestore, 'roles_admin', user.uid);
    }, [firestore, user?.uid]);
    const { data: adminRole, isLoading: isAdminRoleLoading } = useDoc<{ isAdmin?: boolean }>(adminRoleRef);
    const isAdmin = adminRole?.isAdmin === true;

    // Fetch all users
    const usersQuery = useMemoFirebase(() => {
        if (!firestore || !isAdmin) return null; // Only fetch if user is admin
        return query(collection(firestore, 'users'));
    }, [firestore, isAdmin]);

    const { data: users, isLoading: usersLoading, error: usersError } = useCollection(usersQuery);

    useEffect(() => {
        // If loading is finished and user is not an admin, redirect
        if (!isUserLoading && !isAdminRoleLoading && !isAdmin) {
            router.push('/dashboard');
        }
    }, [user, isUserLoading, isAdmin, isAdminRoleLoading, router]);

    const isLoading = isUserLoading || isAdminRoleLoading;

    if (isLoading) {
        return (
            <div className="dark min-h-screen bg-background text-foreground p-4 sm:p-6 lg:p-8">
                <header className="flex items-center gap-4 mb-8">
                    <Skeleton className="h-8 w-8" />
                    <Skeleton className="h-8 w-64" />
                </header>
                <main className="max-w-4xl mx-auto">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {Array.from({ length: 6 }).map((_, i) => (
                            <Card key={i}><CardContent className="p-4 flex items-center gap-4"><Skeleton className="h-12 w-12 rounded-full" /><div className="space-y-2"><Skeleton className="h-4 w-[150px]" /><Skeleton className="h-4 w-[200px]" /></div></CardContent></Card>
                        ))}
                    </div>
                </main>
            </div>
        );
    }
    
    if (!isAdmin) {
        return (
             <div className="flex min-h-screen flex-col items-center justify-center bg-background p-8">
                <p>Redirigiendo...</p>
            </div>
        )
    }

    return (
        <div className="dark min-h-screen bg-background text-foreground p-4 sm:p-6 lg:p-8">
            <header className="flex items-center gap-4 mb-8">
                <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => router.push('/settings')}>
                    <ArrowLeft className="h-4 w-4" />
                    <span className="sr-only">Volver</span>
                </Button>
                <h1 className="text-2xl font-bold">Panel de Administración</h1>
            </header>
            <main className="max-w-4xl mx-auto">
                <UserList users={users} isLoading={usersLoading} error={usersError} />
            </main>
        </div>
    );
}
