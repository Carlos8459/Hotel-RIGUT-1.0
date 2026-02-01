'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useUser, useFirestore, useCollection, useMemoFirebase, useDoc, updateDocumentNonBlocking } from '@/firebase';
import { collection, doc, writeBatch } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ArrowLeft, Save, ShieldCheck } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';

type PermissionKeys = 'viewStats' | 'manageSettings' | 'manageWhatsapp' | 'accessAdmin' | 'exportData' | 'manageExpenses';

const permissionLabels: Record<PermissionKeys, string> = {
    viewStats: 'Ver Estadísticas',
    manageSettings: 'Ajustes (Habitaciones/Consumos)',
    manageWhatsapp: 'Automatización de WhatsApp',
    accessAdmin: 'Acceso a Administración',
    exportData: 'Exportar Datos',
    manageExpenses: 'Registrar Gastos',
};

type UserData = {
    id: string;
    username: string;
    email: string;
    role: 'Admin' | 'Socio' | 'Colaborador';
    permissions: {
        viewStats: boolean;
        manageSettings: boolean;
        manageWhatsapp: boolean;
        accessAdmin: boolean;
        exportData: boolean;
        manageExpenses: boolean;
    };
};

export default function PermissionsPage() {
    const { user, isUserLoading } = useUser();
    const router = useRouter();
    const firestore = useFirestore();
    const { toast } = useToast();

    const [users, setUsers] = useState<UserData[]>([]);
    const [isSaving, setIsSaving] = useState(false);

    // Admin role check
    const adminUserDocRef = useMemoFirebase(() => (firestore && user) ? doc(firestore, 'users', user.uid) : null, [firestore, user]);
    const { data: adminProfile, isLoading: isAdminProfileLoading } = useDoc<{ role: 'Admin' }>(adminUserDocRef);

    // Fetch all users
    const usersCollection = useMemoFirebase(() => firestore ? collection(firestore, 'users') : null, [firestore]);
    const { data: usersData, isLoading: usersLoading } = useCollection(usersCollection);

    useEffect(() => {
        if (!isUserLoading && !user) {
            router.push('/');
        }
        if (!isAdminProfileLoading && adminProfile && adminProfile.role !== 'Admin') {
            toast({
                title: "Acceso Denegado",
                description: "Solo los administradores pueden gestionar permisos.",
                variant: "destructive",
            });
            router.push('/dashboard');
        }
    }, [user, isUserLoading, adminProfile, isAdminProfileLoading, router, toast]);

    useEffect(() => {
        if (usersData) {
            const processedUsers = usersData.map(u => ({
                id: u.id,
                username: u.username,
                email: u.email,
                role: u.role || 'Colaborador',
                permissions: u.permissions || {
                    viewStats: false,
                    manageSettings: false,
                    manageWhatsapp: false,
                    accessAdmin: false,
                    exportData: false,
                    manageExpenses: false,
                },
            }));
            setUsers(processedUsers);
        }
    }, [usersData]);

    const handlePermissionChange = (userId: string, permission: PermissionKeys, value: boolean) => {
        setUsers(currentUsers =>
            currentUsers.map(u =>
                u.id === userId ? { ...u, permissions: { ...u.permissions, [permission]: value } } : u
            )
        );
    };

    const handleRoleChange = (userId: string, role: UserData['role']) => {
        setUsers(currentUsers =>
            currentUsers.map(u => (u.id === userId ? { ...u, role } : u))
        );
    };

    const handleSaveChanges = async () => {
        if (!firestore) return;
        setIsSaving(true);
        
        try {
            const batch = writeBatch(firestore);
            users.forEach(u => {
                if (u.id === user?.uid) return; // Don't allow admin to change their own role/permissions here
                const userRef = doc(firestore, 'users', u.id);
                batch.update(userRef, {
                    role: u.role,
                    permissions: u.permissions,
                });
            });
            await batch.commit();
            toast({
                title: 'Permisos Actualizados',
                description: 'Los roles y permisos de los usuarios han sido guardados.',
            });
        } catch (error) {
            console.error("Error saving permissions:", error);
            toast({
                title: 'Error al Guardar',
                description: 'No se pudieron actualizar los permisos.',
                variant: 'destructive',
            });
        } finally {
            setIsSaving(false);
        }
    };
    
    const isLoading = isUserLoading || isAdminProfileLoading || usersLoading;

    if (isLoading) {
        return (
             <div className="dark min-h-screen bg-background text-foreground p-4 pt-16 sm:p-6 lg:p-8">
                <header className="flex items-center gap-4 mb-8">
                    <Skeleton className="h-8 w-8" />
                    <Skeleton className="h-7 w-64" />
                </header>
                <main className="max-w-4xl mx-auto space-y-4">
                    <Skeleton className="h-48 w-full" />
                    <Skeleton className="h-64 w-full" />
                </main>
            </div>
        );
    }
    
    if (!adminProfile || adminProfile.role !== 'Admin') {
        return null; // Redirect is handled by useEffect
    }


    return (
        <div className="dark min-h-screen bg-background text-foreground p-4 pt-16 sm:p-6 lg:p-8">
            <header className="flex items-center gap-4 mb-8">
                <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => router.back()}>
                    <ArrowLeft className="h-4 w-4" />
                    <span className="sr-only">Volver</span>
                </Button>
                <div className="flex items-center gap-3">
                    <ShieldCheck className="h-7 w-7 text-primary" />
                    <div>
                        <h1 className="text-2xl font-bold">Gestionar Permisos</h1>
                        <p className="text-muted-foreground">Asigna roles y permisos a cada miembro del equipo.</p>
                    </div>
                </div>
            </header>

            <main className="max-w-4xl mx-auto space-y-6">
                <div className="space-y-4">
                    {users.map(u => (
                        <Card key={u.id}>
                            <CardHeader>
                                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                                    <div>
                                        <CardTitle>{u.username}</CardTitle>
                                        <CardDescription>{u.email}</CardDescription>
                                    </div>
                                    <div className="w-full sm:w-48">
                                         <Select
                                            value={u.role}
                                            onValueChange={(value: UserData['role']) => handleRoleChange(u.id, value)}
                                            disabled={u.id === user?.uid}
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder="Seleccionar rol" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="Admin">Admin</SelectItem>
                                                <SelectItem value="Socio">Socio</SelectItem>
                                                <SelectItem value="Colaborador">Colaborador</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <Separator />
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pt-4">
                                    {Object.entries(permissionLabels).map(([key, label]) => (
                                        <div key={key} className="flex items-center justify-between space-x-2 p-3 border rounded-md">
                                            <Label htmlFor={`permission-${u.id}-${key}`} className="text-sm font-medium leading-none">
                                                {label}
                                            </Label>
                                            <Switch
                                                id={`permission-${u.id}-${key}`}
                                                checked={u.permissions[key as PermissionKeys] || false}
                                                onCheckedChange={(checked) => handlePermissionChange(u.id, key as PermissionKeys, checked)}
                                                disabled={u.role === 'Admin' || u.id === user?.uid}
                                            />
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
                 <div className="flex justify-end mt-8">
                    <Button onClick={handleSaveChanges} disabled={isSaving}>
                        <Save className="mr-2 h-4 w-4" />
                        {isSaving ? 'Guardando...' : 'Guardar Todos los Cambios'}
                    </Button>
                </div>
            </main>
        </div>
    );
}
