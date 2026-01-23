'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useUser, useFirestore, useCollection, useMemoFirebase, setDocumentNonBlocking, updateDocumentNonBlocking, deleteDocumentNonBlocking } from '@/firebase';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { collection, doc } from 'firebase/firestore';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Save, PlusCircle, Trash2 } from 'lucide-react';
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
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import type { Room } from '@/lib/types';


type EditableRoom = Room & { originalPrice: number; originalType: string; originalStatus: string; };

const newRoomSchema = z.object({
  id: z.string()
    .min(1, { message: 'El ID es obligatorio.' })
    .regex(/^[a-zA-Z0-9_.-]+$/, { message: 'ID solo puede contener letras, números, ., _, -' })
    .refine(id => !id.includes('/'), { message: 'El ID no puede contener "/".' })
    .refine(id => id !== '.' && id !== '..', { message: 'El ID no puede ser "." o "..".' }),
  title: z.string().min(3, { message: 'El nombre debe tener al menos 3 caracteres.' }),
  price: z.coerce.number().positive({ message: 'El precio debe ser un número positivo.' }),
  type: z.enum(["Unipersonal", "Matrimonial", "Doble", "Triple", "Quintuple", "Unipersonal con A/C", "Matrimonial con A/C"]),
});


export default function RoomSettingsPage() {
    const { user, isUserLoading } = useUser();
    const router = useRouter();
    const firestore = useFirestore();
    const { toast } = useToast();

    const roomsCollection = useMemoFirebase(() => firestore ? collection(firestore, 'rooms') : null, [firestore]);
    const { data: roomsData, isLoading: roomsLoading } = useCollection<Omit<Room, 'id'>>(roomsCollection);

    const [editableRooms, setEditableRooms] = useState<EditableRoom[]>([]);
    const [isSaving, setIsSaving] = useState(false);
    const [isAddRoomDialogOpen, setIsAddRoomDialogOpen] = useState(false);
    
    const form = useForm<z.infer<typeof newRoomSchema>>({
        resolver: zodResolver(newRoomSchema),
        defaultValues: {
            id: "",
            title: "",
            price: 0,
            type: "Unipersonal",
        },
    });

    useEffect(() => {
        if (!isUserLoading && !user) {
            router.push('/');
        }
    }, [user, isUserLoading, router]);

    useEffect(() => {
        if (roomsData) {
            const sortedRooms = [...roomsData].sort((a, b) => a.title.localeCompare(b.title, undefined, { numeric: true }));
            setEditableRooms(
                sortedRooms.map(room => ({
                    ...room,
                    id: room.id,
                    originalPrice: room.price,
                    originalType: room.type,
                    originalStatus: room.status,
                }))
            );
        }
    }, [roomsData]);

    const handleRoomChange = (id: string, field: keyof Room, value: string | number) => {
        setEditableRooms(prev => 
            prev.map(room => 
                room.id === id ? { ...room, [field]: value } : room
            )
        );
    };

    const handleSaveChanges = () => {
        if (!firestore) return;
        setIsSaving(true);
        
        editableRooms.forEach(room => {
            const hasChanged = room.price !== room.originalPrice || room.type !== room.originalType || room.status !== room.originalStatus;
            if (hasChanged) {
                const roomDocRef = doc(firestore, 'rooms', room.id);
                const dataToUpdate = {
                    price: room.price,
                    type: room.type,
                    status: room.status,
                };
                updateDocumentNonBlocking(roomDocRef, dataToUpdate);
            }
        });

        toast({
            title: "Cambios Guardados",
            description: "La configuración de las habitaciones ha sido actualizada.",
        });
        setIsSaving(false);
    };
    
    const onAddRoomSubmit = (values: z.infer<typeof newRoomSchema>) => {
        if (!firestore) {
            toast({
                variant: 'destructive',
                title: 'Error',
                description: 'No se pudo conectar a la base de datos.',
            });
            return;
        }

        const newRoomRef = doc(firestore, 'rooms', values.id);
        const newRoomData = {
            title: values.title,
            price: values.price,
            type: values.type,
            status: 'Disponible'
        };
        
        setDocumentNonBlocking(newRoomRef, newRoomData, { merge: false });

        toast({
            title: "Habitación Agregada",
            description: `La habitación ${values.title} ha sido creada.`,
        });
        setIsAddRoomDialogOpen(false);
        form.reset();
    };

    const handleDeleteRoom = (roomId: string) => {
        if (!firestore) return;
        deleteDocumentNonBlocking(doc(firestore, 'rooms', roomId));
        toast({
            title: 'Habitación Eliminada',
            description: 'La habitación ha sido eliminada permanentemente.',
        });
    };

    if (isUserLoading || !user) {
        return (
            <div className="flex min-h-screen flex-col items-center justify-center bg-background p-8">
                <p>Cargando...</p>
            </div>
        );
    }
    
    const roomTypes = ["Unipersonal", "Matrimonial", "Doble", "Triple", "Quintuple", "Unipersonal con A/C", "Matrimonial con A/C"];
    const roomStatuses = ["Disponible", "Mantenimiento"];


    return (
        <div className="dark min-h-screen bg-background text-foreground p-4 sm:p-6 lg:p-8">
            <header className="flex items-center gap-4 mb-8">
                 <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => router.back()}>
                    <ArrowLeft className="h-4 w-4" />
                    <span className="sr-only">Volver</span>
                </Button>
                <h1 className="text-2xl font-bold">Configuración de Habitaciones</h1>
            </header>

            <main className="max-w-4xl mx-auto space-y-8">
                <Card>
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <CardTitle>Administrar Habitaciones</CardTitle>
                             <Dialog open={isAddRoomDialogOpen} onOpenChange={setIsAddRoomDialogOpen}>
                                <DialogTrigger asChild>
                                    <Button variant="outline">
                                        <PlusCircle className="mr-2 h-4 w-4" />
                                        Agregar Habitación
                                    </Button>
                                </DialogTrigger>
                                <DialogContent className="sm:max-w-md">
                                    <DialogHeader>
                                        <DialogTitle>Agregar Nueva Habitación</DialogTitle>
                                        <DialogDescription>
                                            Define los detalles de la nueva habitación. El ID debe ser único.
                                        </DialogDescription>
                                    </DialogHeader>
                                    <Form {...form}>
                                        <form onSubmit={form.handleSubmit(onAddRoomSubmit)} className="space-y-4 pt-4">
                                            <FormField control={form.control} name="id" render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>ID de Habitación</FormLabel>
                                                    <FormControl><Input placeholder="Ej: 101" {...field} /></FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )} />
                                            <FormField control={form.control} name="title" render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Nombre / Título</FormLabel>
                                                    <FormControl><Input placeholder="Ej: Habitación 101" {...field} /></FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )} />
                                             <FormField control={form.control} name="price" render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Precio por Noche (C$)</FormLabel>
                                                    <FormControl><Input type="number" placeholder="Ej: 500" {...field} /></FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )} />
                                            <FormField control={form.control} name="type" render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Tipo de Habitación</FormLabel>
                                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                        <FormControl>
                                                            <SelectTrigger><SelectValue placeholder="Seleccionar tipo" /></SelectTrigger>
                                                        </FormControl>
                                                        <SelectContent>
                                                            {roomTypes.map(type => <SelectItem key={type} value={type}>{type}</SelectItem>)}
                                                        </SelectContent>
                                                    </Select>
                                                    <FormMessage />
                                                </FormItem>
                                            )} />
                                            <DialogFooter>
                                                <Button type="submit">Crear Habitación</Button>
                                            </DialogFooter>
                                        </form>
                                    </Form>
                                </DialogContent>
                            </Dialog>
                        </div>
                        <CardDescription>Ajusta el precio, tipo y estado de cada habitación. Aquí puedes crear nuevas o eliminarlas.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        {roomsLoading ? (
                            <div className="space-y-4">
                                {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-20 w-full" />)}
                            </div>
                        ) : (
                            <div className="space-y-4 max-h-[50vh] overflow-y-auto pr-2">
                                {editableRooms.map((room) => (
                                    <div key={room.id} className="grid grid-cols-1 sm:grid-cols-12 items-center gap-3 p-3 border rounded-lg">
                                        <div className="sm:col-span-3">
                                            <Label htmlFor={`title-${room.id}`} className="font-semibold text-base">{room.title}</Label>
                                        </div>
                                        <div className="space-y-2 sm:col-span-2">
                                            <Label htmlFor={`price-${room.id}`}>Precio (C$)</Label>
                                            <Input 
                                                id={`price-${room.id}`} 
                                                type="number" 
                                                value={room.price}
                                                onChange={(e) => handleRoomChange(room.id, 'price', parseInt(e.target.value, 10) || 0)}
                                            />
                                        </div>
                                        <div className="space-y-2 sm:col-span-3">
                                            <Label htmlFor={`type-${room.id}`}>Tipo</Label>
                                            <Select value={room.type} onValueChange={(value) => handleRoomChange(room.id, 'type', value)}>
                                                <SelectTrigger id={`type-${room.id}`}><SelectValue /></SelectTrigger>
                                                <SelectContent>
                                                    {roomTypes.map(type => <SelectItem key={type} value={type}>{type}</SelectItem>)}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                         <div className="space-y-2 sm:col-span-3">
                                            <Label htmlFor={`status-${room.id}`}>Estado</Label>
                                            <Select value={room.status} onValueChange={(value) => handleRoomChange(room.id, 'status', value)}>
                                                <SelectTrigger id={`status-${room.id}`}><SelectValue /></SelectTrigger>
                                                <SelectContent>
                                                    {roomStatuses.map(status => <SelectItem key={status} value={status}>{status}</SelectItem>)}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="sm:col-span-1 flex justify-end">
                                            <AlertDialog>
                                                <AlertDialogTrigger asChild>
                                                    <Button variant="ghost" size="icon">
                                                        <Trash2 className="h-4 w-4 text-destructive" />
                                                    </Button>
                                                </AlertDialogTrigger>
                                                <AlertDialogContent>
                                                    <AlertDialogHeader>
                                                        <AlertDialogTitle>¿Eliminar habitación?</AlertDialogTitle>
                                                        <AlertDialogDescription>
                                                            Esta acción es permanente y no se puede deshacer. ¿Estás seguro de que quieres eliminar la habitación {room.title}?
                                                        </AlertDialogDescription>
                                                    </AlertDialogHeader>
                                                    <AlertDialogFooter>
                                                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                                        <AlertDialogAction
                                                            className="bg-destructive hover:bg-destructive/90"
                                                            onClick={() => handleDeleteRoom(room.id)}
                                                        >
                                                            Eliminar
                                                        </AlertDialogAction>
                                                    </AlertDialogFooter>
                                                </AlertDialogContent>
                                            </AlertDialog>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>

                <div className="flex justify-end">
                    <Button onClick={handleSaveChanges} disabled={isSaving}>
                        <Save className="mr-2 h-4 w-4" />
                        {isSaving ? 'Guardando...' : 'Guardar Cambios'}
                    </Button>
                </div>
            </main>
        </div>
    );
}
