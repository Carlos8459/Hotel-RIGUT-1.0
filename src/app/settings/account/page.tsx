'use client';

import { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useUser, useAuth, useFirestore, useMemoFirebase, useDoc } from '@/firebase';
import { signOut, reauthenticateWithCredential, EmailAuthProvider, updatePassword } from 'firebase/auth';
import { doc } from 'firebase/firestore';
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, KeyRound, LogOut, AlertCircle, Users } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';

const changePinSchema = z.object({
  currentPassword: z.string().min(1, { message: "El PIN actual es obligatorio." }),
  newPassword: z.string().min(6, { message: "El nuevo PIN debe tener al menos 6 caracteres." }),
  confirmPassword: z.string(),
}).refine(data => data.newPassword === data.confirmPassword, {
  message: "Los nuevos PIN no coinciden.",
  path: ["confirmPassword"],
});


export default function AccountSettingsPage() {
    const { user, isUserLoading } = useUser();
    const router = useRouter();
    const auth = useAuth();
    const firestore = useFirestore();
    const { toast } = useToast();

    const userDocRef = useMemoFirebase(() => (firestore && user) ? doc(firestore, 'users', user.uid) : null, [firestore, user]);
    const { data: userProfile, isLoading: isUserProfileLoading } = useDoc<{role: 'Admin' | 'Socio'}>(userDocRef);

    const [isPending, setIsPending] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [isDialogOpen, setIsDialogOpen] = useState(false);

    const form = useForm<z.infer<typeof changePinSchema>>({
        resolver: zodResolver(changePinSchema),
        defaultValues: {
            currentPassword: "",
            newPassword: "",
            confirmPassword: "",
        },
    });

    useEffect(() => {
        if (!isUserLoading && !user) {
            router.push('/');
        }
    }, [user, isUserLoading, router]);

    const handleLogout = async () => {
        await signOut(auth);
        router.push('/');
    };
    
    const onSubmitPinChange = async (values: z.infer<typeof changePinSchema>) => {
        setIsPending(true);
        setErrorMessage(null);

        if (!user || !user.email) {
            setErrorMessage("No se pudo verificar la identidad del usuario.");
            setIsPending(false);
            return;
        }

        try {
            const credential = EmailAuthProvider.credential(user.email, values.currentPassword);
            await reauthenticateWithCredential(user, credential);

            await updatePassword(user, values.newPassword);

            toast({
                title: "PIN actualizado",
                description: "Tu PIN ha sido cambiado exitosamente. Por favor, inicia sesión de nuevo.",
            });
            
            setIsDialogOpen(false);
            form.reset();
            
            // Log out user after password change for security
            await signOut(auth);
            router.push('/');

        } catch (error: any) {
            console.error(error);
            if (error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
                form.setError("currentPassword", { type: "manual", message: "El PIN actual es incorrecto." });
            } else {
                setErrorMessage("Ocurrió un error inesperado al cambiar el PIN.");
            }
        } finally {
            setIsPending(false);
        }
    };


    if (isUserLoading || isUserProfileLoading || !user) {
        return (
            <div className="flex min-h-screen flex-col items-center justify-center bg-background p-8">
                <p>Cargando...</p>
            </div>
        );
    }

    return (
        <div className="dark min-h-screen bg-background text-foreground p-4 sm:p-6 lg:p-8">
            <header className="flex items-center gap-4 mb-8">
                 <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => router.back()}>
                    <ArrowLeft className="h-4 w-4" />
                    <span className="sr-only">Volver</span>
                </Button>
                <h1 className="text-2xl font-bold">Configuración de la Cuenta</h1>
            </header>

            <main className="max-w-2xl mx-auto space-y-8">
                <Card>
                    <CardHeader>
                        <CardTitle>Información del Perfil</CardTitle>
                        <CardDescription>Estos son los detalles de tu cuenta.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="email">Correo Electrónico</Label>
                            <Input id="email" type="email" defaultValue={user.email || ''} disabled />
                        </div>
                         <div className="space-y-2">
                            <Label htmlFor="role">Rol</Label>
                            <Input id="role" type="text" defaultValue={userProfile?.role || 'Socio'} disabled />
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Seguridad</CardTitle>
                        <CardDescription>Cambia tu PIN y gestiona la seguridad de tu cuenta.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                            <DialogTrigger asChild>
                                <Button>
                                    <KeyRound className="mr-2 h-4 w-4" />
                                    Cambiar PIN
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="sm:max-w-[425px]">
                                <DialogHeader>
                                    <DialogTitle>Cambiar PIN</DialogTitle>
                                    <DialogDescription>
                                        Actualiza tu PIN de seguridad. Se cerrará tu sesión actual después del cambio.
                                    </DialogDescription>
                                </DialogHeader>
                                <Form {...form}>
                                    <form onSubmit={form.handleSubmit(onSubmitPinChange)} className="space-y-4 pt-4">
                                        <FormField
                                            control={form.control}
                                            name="currentPassword"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>PIN Actual</FormLabel>
                                                    <FormControl>
                                                        <Input type="password" {...field} />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                        <FormField
                                            control={form.control}
                                            name="newPassword"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Nuevo PIN</FormLabel>
                                                    <FormControl>
                                                        <Input type="password" {...field} />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                        <FormField
                                            control={form.control}
                                            name="confirmPassword"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Confirmar Nuevo PIN</FormLabel>
                                                    <FormControl>
                                                        <Input type="password" {...field} />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />

                                        {errorMessage && (
                                            <Alert variant="destructive">
                                                <AlertCircle className="h-4 w-4" />
                                                <AlertTitle>Error</AlertTitle>
                                                <AlertDescription>{errorMessage}</AlertDescription>
                                            </Alert>
                                        )}

                                        <div className="flex justify-between items-center pt-4">
                                            <Button asChild variant="link" className="p-0 h-auto text-sm text-muted-foreground hover:text-primary">
                                                <Link href="/forgot-password">
                                                    ¿Olvidaste tu pin?
                                                </Link>
                                            </Button>
                                            <Button type="submit" disabled={isPending}>
                                                {isPending ? 'Guardando...' : 'Guardar Cambios'}
                                            </Button>
                                        </div>
                                    </form>
                                </Form>
                            </DialogContent>
                        </Dialog>
                    </CardContent>
                </Card>

                {userProfile?.role === 'Admin' && (
                    <Card>
                        <CardHeader>
                            <CardTitle>Gestión de Socios</CardTitle>
                            <CardDescription>Agrega o administra las cuentas de tus socios.</CardDescription>
                        </CardHeader>
                        <CardContent>
                        <Button asChild>
                            <Link href="/admin/users">
                                <Users className="mr-2 h-4 w-4" />
                                Gestionar Socios
                            </Link>
                        </Button>
                        </CardContent>
                    </Card>
                )}

                <Card>
                    <CardHeader>
                        <CardTitle>Cerrar Sesión</CardTitle>
                        <CardDescription>Cierra la sesión en tu dispositivo actual.</CardDescription>
                    </CardHeader>
                    <CardContent>
                       <Button variant="destructive" onClick={handleLogout}>
                            <LogOut className="mr-2 h-4 w-4" />
                            Cerrar sesión
                       </Button>
                    </CardContent>
                </Card>
            </main>
        </div>
    );
}
