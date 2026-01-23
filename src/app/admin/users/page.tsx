'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useUser } from '@/firebase';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ArrowLeft, UserPlus, MoreVertical, Trash2 } from 'lucide-react';
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
} from "@/components/ui/dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";


type User = {
    id: string;
    name: string;
    email: string;
    role: string;
};

// Placeholder data for users. In a real app, this would come from Firestore.
const initialUsers: User[] = [
    { id: '1', name: 'Socio Uno', email: 'socio1@example.com', role: 'Socio' },
    { id: '2', name: 'Socio Dos', email: 'socio2@example.com', role: 'Socio' },
    { id: '3', name: 'Admin Principal', email: 'admin@example.com', role: 'Admin' },
];

export default function ManageUsersPage() {
    const { user, isUserLoading } = useUser();
    const router = useRouter();

    const [users, setUsers] = useState<User[]>(initialUsers);
    const [editingUser, setEditingUser] = useState<User | null>(null);
    const [newRole, setNewRole] = useState('');

    useEffect(() => {
        if (!isUserLoading && !user) {
            router.push('/');
        }
        // Note: For a real implementation, we would add role-based access control here
        // to ensure only administrators can access this page.
    }, [user, isUserLoading, router]);

    const handleEditRoleClick = (userToEdit: User) => {
        setEditingUser(userToEdit);
        setNewRole(userToEdit.role);
    };

    const handleSaveChanges = () => {
        if (editingUser) {
            setUsers(users.map(u => (u.id === editingUser.id ? { ...u, role: newRole } : u)));
            setEditingUser(null);
        }
    };

    const handleCloseDialog = () => {
        setEditingUser(null);
    };

    if (isUserLoading || !user) {
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
                <div className="flex-grow">
                    <h1 className="text-2xl font-bold">Gestionar Socios</h1>
                    <p className="text-muted-foreground">Agrega, elimina o edita los socios de tu equipo.</p>
                </div>
                <Button>
                    <UserPlus className="mr-2 h-4 w-4" />
                    Agregar Socio
                </Button>
            </header>

            <main className="max-w-4xl mx-auto">
                <Card>
                    <CardContent className="p-0">
                        <div className="divide-y divide-border">
                            {users.map((member) => (
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
                                                <Button variant="ghost" size="icon">
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
                                                                Esta acción no se puede deshacer. Se eliminará permanentemente la cuenta del socio.
                                                            </AlertDialogDescription>
                                                        </AlertDialogHeader>
                                                        <AlertDialogFooter>
                                                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                                            <AlertDialogAction className="bg-destructive hover:bg-destructive/90">Eliminar</AlertDialogAction>
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
                <p className="text-center text-sm text-muted-foreground mt-8">
                    * Esta es una vista de demostración. Se necesita implementar roles y permisos para la funcionalidad completa.
                </p>
            </main>

            <Dialog open={!!editingUser} onOpenChange={(isOpen) => !isOpen && handleCloseDialog()}>
                <DialogContent>
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
