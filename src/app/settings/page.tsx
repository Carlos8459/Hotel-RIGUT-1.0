'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useUser, useAuth, useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { signOut, sendPasswordResetEmail } from 'firebase/auth';
import { doc } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { LayoutGrid, Calendar, Users, Settings } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Skeleton } from '@/components/ui/skeleton';

export default function SettingsPage() {
    const { user, isUserLoading } = useUser();
    const router = useRouter();
    const auth = useAuth();
    const firestore = useFirestore();
    const { toast } = useToast();
    const [isSendingEmail, setIsSendingEmail] = useState(false);

    // Admin Check
    const adminRoleRef = useMemoFirebase(() => {
        if (!firestore || !user?.uid) return null;
        return doc(firestore, 'roles_admin', user.uid);
    }, [firestore, user?.uid]);
    const { data: adminRole, isLoading: isAdminRoleLoading } = useDoc<{ isAdmin?: boolean }>(adminRoleRef);
    const isAdmin = adminRole?.isAdmin === true;

    useEffect(() => {
        if (!isUserLoading && !user) {
            router.push('/');
        }
    }, [user, isUserLoading, router]);

    const handleLogout = async () => {
        await signOut(auth);
        router.push('/'); // Force redirect to login page
    };

    const handleChangePin = async () => {
        if (!user?.email) {
            toast({
                variant: "destructive",
                title: "Error",
                description: "No hay un correo electrónico asociado a esta cuenta.",
            });
            return;
        }
        setIsSendingEmail(true);
        try {
            await sendPasswordResetEmail(auth, user.email);
            toast({
                title: "Correo enviado",
                description: "Se ha enviado un enlace para restablecer tu PIN a tu correo electrónico.",
            });
        } catch (error) {
            console.error("Password reset error:", error);
            toast({
                variant: "destructive",
                title: "Error",
                description: "No se pudo enviar el correo de restablecimiento. Inténtalo de nuevo más tarde.",
            });
        } finally {
            setIsSendingEmail(false);
        }
    };

    if (isUserLoading || isAdminRoleLoading || !user) {
        return (
            <div className="dark min-h-screen bg-background text-foreground p-4 sm:p-6 lg:p-8 pb-24">
                <header className="flex items-center justify-between mb-8">
                    <h1 className="text-2xl font-bold">Configuración</h1>
                </header>
                <main className="max-w-2xl mx-auto space-y-8">
                    <Card>
                        <CardHeader><Skeleton className="h-6 w-32" /></CardHeader>
                        <CardContent><Skeleton className="h-10 w-full" /></CardContent>
                    </Card>
                    <Card>
                        <CardHeader><Skeleton className="h-6 w-32" /></CardHeader>
                        <CardContent className="space-y-4">
                            <Skeleton className="h-8 w-full" />
                            <Skeleton className="h-8 w-full" />
                        </CardContent>
                    </Card>
                </main>
            </div>
        );
    }

    return (
        <div className="dark min-h-screen bg-background text-foreground p-4 sm:p-6 lg:p-8 pb-24">
            <header className="flex items-center justify-between mb-8">
                <h1 className="text-2xl font-bold">Configuración</h1>
            </header>

            <main className="max-w-2xl mx-auto space-y-8">
                <Card>
                    <CardHeader>
                        <CardTitle>Perfil</CardTitle>
                        <CardDescription>Administra los detalles de tu cuenta.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center justify-between">
                            <p className="text-sm font-medium">Nombre de usuario</p>
                            <p className="text-sm text-muted-foreground">{user.displayName || user.email}</p>
                        </div>
                        <div className="flex items-center justify-between">
                            <p className="text-sm font-medium">Correo electrónico</p>
                            <p className="text-sm text-muted-foreground">{user.email}</p>
                        </div>
                        <AlertDialog>
                            <AlertDialogTrigger asChild>
                            <Button variant="outline" className="mt-2">Cambiar PIN</Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent className="max-w-xs rounded-3xl">
                            <AlertDialogHeader>
                                <AlertDialogTitle>¿Cambiar tu PIN?</AlertDialogTitle>
                                <AlertDialogDescription>
                                Se enviará un correo electrónico a <strong>{user.email}</strong> con instrucciones para restablecer tu PIN. ¿Deseas continuar?
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                <AlertDialogAction onClick={handleChangePin} disabled={isSendingEmail}>
                                {isSendingEmail ? "Enviando..." : "Enviar correo"}
                                </AlertDialogAction>
                            </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                    </CardContent>
                </Card>

                {isAdmin && (
                    <Card>
                        <CardHeader>
                            <CardTitle>Administración</CardTitle>
                            <CardDescription>Gestionar usuarios, roles y permisos de la aplicación.</CardDescription>
                        </CardHeader>
                        <CardContent>
                           <Button onClick={() => router.push('/admin')}>Administración</Button>
                        </CardContent>
                    </Card>
                )}

                <Card>
                    <CardHeader>
                        <CardTitle>Notificaciones</CardTitle>
                        <CardDescription>Elige cómo quieres recibir notificaciones.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center justify-between">
                            <Label htmlFor="email-notifications" className="flex-grow">Notificaciones por correo</Label>
                            <Switch id="email-notifications" />
                        </div>
                        <div className="flex items-center justify-between">
                            <Label htmlFor="push-notifications" className="flex-grow">Notificaciones push</Label>
                            <Switch id="push-notifications" checked />
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Apariencia</CardTitle>
                        <CardDescription>Personaliza la apariencia de la aplicación.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                       <div className="flex items-center justify-between">
                            <Label htmlFor="dark-mode" className="flex-grow">Modo oscuro</Label>
                            <Switch id="dark-mode" checked disabled />
                        </div>
                         <p className="text-sm text-muted-foreground">Más opciones de temas estarán disponibles próximamente.</p>
                    </CardContent>
                </Card>

                 <Card>
                    <CardHeader>
                        <CardTitle>Seguridad</CardTitle>
                        <CardDescription>Gestiona la seguridad de tu cuenta.</CardDescription>
                    </CardHeader>
                    <CardContent>
                       <Button variant="destructive" onClick={handleLogout}>Cerrar sesión</Button>
                    </CardContent>
                </Card>
            </main>

            <footer className="fixed bottom-0 left-0 right-0 bg-card border-t border-border p-2 z-10 md:hidden">
                <div className="flex justify-around">
                    <Link href="/dashboard">
                        <Button variant="ghost" className="flex flex-col h-auto items-center text-muted-foreground px-2 py-1">
                            <LayoutGrid className="h-5 w-5 mb-1" />
                            <span className="text-xs font-medium">Habitaciones</span>
                        </Button>
                    </Link>
                    <Link href="/reservations">
                        <Button variant="ghost" className="flex flex-col h-auto items-center text-muted-foreground px-2 py-1">
                            <Calendar className="h-5 w-5 mb-1" />
                            <span className="text-xs font-medium">Reservas</span>
                        </Button>
                    </Link>
                    <Link href="/customers">
                        <Button variant="ghost" className="flex flex-col h-auto items-center text-muted-foreground px-2 py-1">
                            <Users className="h-5 w-5 mb-1" />
                            <span className="text-xs font-medium">Clientes</span>
                        </Button>
                    </Link>
                    <Link href="/settings">
                        <Button variant="ghost" className="flex flex-col h-auto items-center text-primary px-2 py-1">
                            <Settings className="h-5 w-5 mb-1" />
                            <span className="text-xs font-medium">Ajustes</span>
                        </Button>
                    </Link>
                </div>
            </footer>
        </div>
    );
}
