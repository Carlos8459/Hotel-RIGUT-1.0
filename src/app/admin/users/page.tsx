'use client';

import { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useUser, useFirestore, useCollection, useMemoFirebase, setDocumentNonBlocking, deleteDocumentNonBlocking, updateDocumentNonBlocking, useDoc } from '@/firebase';
import { initializeApp, deleteApp } from 'firebase/app';
import { getAuth as getTempAuth, createUserWithEmailAndPassword } from 'firebase/auth';
import { firebaseConfig } from '@/firebase/config';
import { collection, doc, setDoc, deleteDoc } from 'firebase/firestore';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useToast } from '@/hooks/use-toast';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ArrowLeft, UserPlus, MoreVertical, Trash2, AlertCircle } from 'lucide-react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogFooter,
    DialogTrigger,
} from "@/components/ui/dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';


type User = {
    id: string;
    name: string;
    email: string;
    role: string;
};

type UserDocument = {
    username: string;
    email: string;
    role: 'Admin' | 'Socio';
    registrationDate: string;
}

const addPartnerSchema = z.object({
  name: z.string().min(3, { message: "El nombre debe tener al menos 3 caracteres." }),
  email: z.string().email({ message: "Por favor, introduce una dirección de correo electrónico válida." }),
  password: z.string().min(6, { message: "El PIN debe tener al menos 6 caracteres." }),
});


export default function ManageUsersPage() {
    const { user, isUserLoading } = useUser();
    const router = useRouter();
    const firestore = useFirestore();
    const { toast } = useToast();

    const userDocRef = useMemoFirebase(() => (firestore && user) ? doc(firestore, 'users', user.uid) : null, [firestore, user]);
    const { data: userProfile, isLoading: isUserProfileLoading } = useDoc<{role: 'Admin' | 'Socio'}>(userDocRef);

    const usersCollection = useMemoFirebase(() => firestore ? collection(firestore, 'users') : null, [firestore]);
    const { data: usersData, isLoading: usersLoading, error: usersError } = useCollection<UserDocument>(usersCollection);
    
    const users = useMemo<User[]>(() => {
        if (!usersData) return [];
        return usersData.map(u => ({
            id: u.id,
            name: u.username,
            email: u.email,
            role: u.role,
        }));
    }, [usersData]);

    const [editingUser, setEditingUser] = useState<User | null>(null);
    const [newRole, setNewRole] = useState('');
    const [isAddPartnerDialogOpen, setIsAddPartnerDialogOpen] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    const form = useForm<z.infer<typeof addPartnerSchema>>({
        resolver: zodResolver(addPartnerSchema),
        defaultValues: {
            name: "",
            email: "",
            password: "",
        },
    });

    useEffect(() => {
        if (!isUserLoading && !user) {
            router.push('/');
        }
        if (!isUserProfileLoading && userProfile && userProfile.role !== 'Admin') {
            toast({
                title: "Acceso Denegado",
                description: "No tienes permiso para acceder a esta página.",
                variant: "destructive",
            });
            router.push('/dashboard');
        }
    }, [user, isUserLoading, userProfile, isUserProfileLoading, router, toast]);

    const handleEditRoleClick = (userToEdit: User) => {
        setEditingUser(userToEdit);
        setNewRole(userToEdit.role);
    };

    const handleSaveChanges = () => {
        if (editingUser && firestore) {
            const userDocRef = doc(firestore, "users", editingUser.id);
            updateDocumentNonBlocking(userDocRef, { role: newRole });
            toast({
                title: "Rol actualizado",
                description: `El rol de ${editingUser.name} ha sido cambiado a ${newRole}.`,
            });
            setEditingUser(null);
        }
    };
    
    const handleDeleteUser = async (userId: string) => {
        if (!firestore) return;
        const userDocRef = doc(firestore, "users", userId);
        deleteDocumentNonBlocking(userDocRef);
        toast({
            title: "Socio eliminado",
            description: `El documento del socio ha sido eliminado de la base de datos.`,
        });
    };

    const handleCloseDialog = () => {
        setEditingUser(null);
    };

    const onAddPartnerSubmit = async (values: z.infer<typeof addPartnerSchema>) => {
        setIsSaving(true);
        form.clearErrors();
        let tempApp;
        try {
            const tempAppName = `temp-user-creation-${Date.now()}`;
            tempApp = initializeApp(firebaseConfig, tempAppName);
            const tempAuth = getTempAuth(tempApp);

            const userCredential = await createUserWithEmailAndPassword(tempAuth, values.email, values.password);
            const newUser = userCredential.user;

            const userProfile = {
                username: values.name,
                email: values.email,
                registrationDate: new Date().toISOString(),
                role: 'Socio'
            };

            if (firestore) {
                setDocumentNonBlocking(doc(firestore, "users", newUser.uid), userProfile, {merge: false});
            }
            
            await deleteApp(tempApp);

            toast({
                title: "Socio agregado",
                description: `${values.name} ha sido agregado exitosamente.`,
            });
            setIsAddPartnerDialogOpen(false);
            form.reset();

        } catch (error: any) {
            console.error("Error creating partner:", error);
            if (tempApp) await deleteApp(tempApp);
            
            if (error.code === 'auth/email-already-in-use') {
                form.setError("email", { message: "Este correo electrónico ya está en uso." });
            } else if (error.code === 'auth/weak-password') {
                form.setError("password", { message: "El PIN es demasiado débil. Debe tener al menos 6 caracteres." });
            } else {
                form.setError("root", { message: "Algo salió mal. Por favor, inténtalo de nuevo." });
            }
        } finally {
            setIsSaving(false);
        }
    };

    if (isUserLoading || isUserProfileLoading) {
        return (
            <div className="flex min-h-screen flex-col items-center justify-center bg-background p-8">
                <p>Cargando y verificando permisos...</p>
            </div>
        );
    }

    if (!user || !userProfile || userProfile.role !== 'Admin') {
        return null;
    }

    return (
        <div className="dark min-h-screen bg-background text-foreground p-4 sm:p-6 lg:p-8">
            <header className="flex items-center gap-4 mb-8">
                <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => router.back()}>
                    <ArrowLeft className="h-4 w-4" />
                    <span className="sr-only">Volver</span>
                </Button>
                <div className="flex-grow">
                    <h1 className="text-2xl font-bold">Gestionar Socios</h1>
                    <p className="text-muted-foreground">Agrega, elimina o edita los socios de tu equipo.</p>
                </div>
                <Dialog open={isAddPartnerDialogOpen} onOpenChange={setIsAddPartnerDialogOpen}>
                    <DialogTrigger asChild>
                         <Button>
                            <UserPlus className="mr-2 h-4 w-4" />
                            Agregar Socio
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[425px]">
                        <DialogHeader>
                            <DialogTitle>Agregar Nuevo Socio</DialogTitle>
                            <DialogDescription>
                                Crea una cuenta para que el nuevo socio pueda acceder a la aplicación.
                            </DialogDescription>
                        </DialogHeader>
                        <Form {...form}>
                            <form onSubmit={form.handleSubmit(onAddPartnerSubmit)} className="space-y-4 pt-4">
                                <FormField
                                    control={form.control}
                                    name="name"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Nombre de Usuario</FormLabel>
                                            <FormControl><Input placeholder="Ej: Socio Uno" {...field} /></FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="email"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Correo Electrónico</FormLabel>
                                            <FormControl><Input type="email" placeholder="socio@example.com" {...field} /></FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="password"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>PIN de Acceso</FormLabel>
                                            <FormControl><Input type="password" placeholder="6+ caracteres" {...field} /></FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                {form.formState.errors.root && (
                                    <Alert variant="destructive">
                                        <AlertCircle className="h-4 w-4" />
                                        <AlertTitle>Error</AlertTitle>
                                        <AlertDescription>{form.formState.errors.root.message}</AlertDescription>
                                    </Alert>
                                )}
                                <DialogFooter>
                                    <Button type="submit" disabled={isSaving}>
                                        {isSaving ? "Creando..." : "Crear Socio"}
                                    </Button>
                                </DialogFooter>
                            </form>
                        </Form>
                    </DialogContent>
                </Dialog>
            </header>

            <main className="max-w-4xl mx-auto">
                <Card>
                    <CardContent className="p-0">
                        <div className="divide-y divide-border">
                            {(usersLoading) && (
                                <div className="space-y-2 p-4">
                                    {[...Array(3)].map((_, i) => (
                                        <div key={i} className="flex items-center gap-4 p-4">
                                            <Skeleton className="h-10 w-10 rounded-full" />
                                            <div className="flex-grow space-y-2">
                                                <Skeleton className="h-4 w-[250px]" />
                                                <Skeleton className="h-4 w-[200px]" />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                            {usersError && (
                                <div className="p-4 text-center text-destructive">
                                    <Alert variant="destructive">
                                        <AlertCircle className="h-4 w-4" />
                                        <AlertTitle>Error de Permisos</AlertTitle>
                                        <AlertDescription>No tienes permisos para ver la lista de socios. Contacta a un administrador.</AlertDescription>
                                    </Alert>
                                </div>
                            )}
                            {!usersLoading && !usersError && users.map((member) => (
                                <div key={member.id} className="flex items-center justify-between p-4 hover:bg-muted/50 transition-colors">
                                    <div className="flex items-center gap-4">
                                        <Avatar>
                                            <AvatarFallback>{member.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                                        </Avatar>
                                        <div>
                                            <p className="font-semibold">{member.name}</p>
                                            <p className="text-sm text-muted-foreground">{member.email}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <p className="text-sm font-medium text-muted-foreground hidden sm:block">{member.role}</p>
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="icon" disabled={user && member.id === user.uid}>
                                                    <MoreVertical className="h-4 w-4" />
                                                    <span className="sr-only">Opciones</span>
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuItem onSelect={(e) => e.preventDefault()} onClick={() => handleEditRoleClick(member)}>
                                                    Editar rol
                                                </DropdownMenuItem>
                                                <AlertDialog>
                                                    <AlertDialogTrigger asChild>
                                                        <Button variant="ghost" className="w-full justify-start text-destructive hover:text-destructive px-2 py-1.5 text-sm h-auto font-normal relative flex cursor-default select-none items-center rounded-sm outline-none transition-colors focus:bg-accent data-[disabled]:pointer-events-none data-[disabled]:opacity-50">
                                                            <Trash2 className="mr-2 h-4 w-4" />
                                                            Eliminar
                                                        </Button>
                                                    </AlertDialogTrigger>
                                                    <AlertDialogContent>
                                                        <AlertDialogHeader>
                                                            <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
                                                            <AlertDialogDescription>
                                                                Esta acción eliminará el perfil del socio en la base de datos de la app. Para revocar su acceso por completo, también debes eliminar su cuenta desde la Consola de Firebase.
                                                            </AlertDialogDescription>
                                                        </AlertDialogHeader>
                                                        <AlertDialogFooter>
                                                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                                            <AlertDialogAction className="bg-destructive hover:bg-destructive/90" onClick={() => handleDeleteUser(member.id)}>Eliminar</AlertDialogAction>
                                                        </AlertDialogFooter>
                                                    </AlertDialogContent>
                                                </AlertDialog>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </main>

            <Dialog open={!!editingUser} onOpenChange={(isOpen) => !isOpen && handleCloseDialog()}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>Editar rol de {editingUser?.name}</DialogTitle>
                        <DialogDescription>
                            Selecciona el nuevo rol para el usuario.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-2 py-4">
                        <Label htmlFor="role-select">Rol del usuario</Label>
                        <Select value={newRole} onValueChange={setNewRole}>
                            <SelectTrigger id="role-select" className="w-full">
                                <SelectValue placeholder="Seleccionar un rol" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="Socio">Socio</SelectItem>
                                <SelectItem value="Admin">Admin</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={handleCloseDialog}>Cancelar</Button>
                        <Button onClick={handleSaveChanges}>Guardar Cambios</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

        </div>
    );
}
