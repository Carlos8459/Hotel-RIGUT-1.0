'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useUser, useFirestore, useCollection, useMemoFirebase, setDocumentNonBlocking, updateDocumentNonBlocking, deleteDocumentNonBlocking, useDoc, addDocumentNonBlocking } from '@/firebase';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { collection, doc } from 'firebase/firestore';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Save, PlusCircle, Trash2, Edit, DollarSign, Utensils, GlassWater, Droplet, Droplets, Beer, Coffee, Sandwich, CakeSlice, IceCream, Package } from 'lucide-react';
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
import type { Room, ConsumptionItem } from '@/lib/types';


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

const consumptionItemSchema = z.object({
  name: z.string().min(2, { message: 'El nombre debe tener al menos 2 caracteres.' }),
  price: z.coerce.number().positive({ message: 'El precio debe ser un número positivo.' }),
  icon: z.string().min(1, { message: 'Debe seleccionar un ícono.' }),
});

export const availableIcons: { [key: string]: React.ReactNode } = {
    Utensils: <Utensils className="h-5 w-5" />,
    GlassWater: <GlassWater className="h-5 w-5" />,
    Droplet: <Droplet className="h-5 w-5" />,
    Droplets: <Droplets className="h-5 w-5" />,
    Beer: <Beer className="h-5 w-5" />,
    Coffee: <Coffee className="h-5 w-5" />,
    Sandwich: <Sandwich className="h-5 w-5" />,
    CakeSlice: <CakeSlice className="h-5 w-5" />,
    IceCream: <IceCream className="h-5 w-5" />,
    Package: <Package className="h-5 w-5" />,
};
export type IconName = keyof typeof availableIcons;

export default function RoomSettingsPage() {
    const { user, isUserLoading } = useUser();
    const router = useRouter();
    const firestore = useFirestore();
    const { toast } = useToast();

    // User Profile
    const userDocRef = useMemoFirebase(() => (firestore && user) ? doc(firestore, 'users', user.uid) : null, [firestore, user]);
    const { data: userProfile, isLoading: isUserProfileLoading } = useDoc<{role: 'Admin' | 'Socio'}>(userDocRef);

    // Rooms Data
    const roomsCollection = useMemoFirebase(() => firestore ? collection(firestore, 'rooms') : null, [firestore]);
    const { data: roomsData, isLoading: roomsLoading } = useCollection<Omit<Room, 'id'>>(roomsCollection);

    // Consumption Items Data
    const consumptionItemsCollection = useMemoFirebase(() => firestore ? collection(firestore, 'consumption_items') : null, [firestore]);
    const { data: consumptionItemsData, isLoading: consumptionItemsLoading } = useCollection<Omit<ConsumptionItem, 'id'>>(consumptionItemsCollection);

    // Rooms State
    const [editableRooms, setEditableRooms] = useState<EditableRoom[]>([]);
    const [isSavingRooms, setIsSavingRooms] = useState(false);
    const [isAddRoomDialogOpen, setIsAddRoomDialogOpen] = useState(false);
    
    // Consumption Items State
    const [isConsumptionDialogOpen, setIsConsumptionDialogOpen] = useState(false);
    const [editingConsumptionItem, setEditingConsumptionItem] = useState<ConsumptionItem | null>(null);


    // --- Forms ---
    const roomForm = useForm<z.infer<typeof newRoomSchema>>({
        resolver: zodResolver(newRoomSchema),
        defaultValues: { id: "", title: "", price: 0, type: "Unipersonal" },
    });

    const consumptionForm = useForm<z.infer<typeof consumptionItemSchema>>({
        resolver: zodResolver(consumptionItemSchema),
        defaultValues: { name: "", price: 0, icon: 'Package' },
    });
    

    // --- Auth & Permissions ---
    useEffect(() => {
        if (!isUserLoading && !user) router.push('/');
        if (!isUserProfileLoading && userProfile && !['Admin', 'Socio'].includes(userProfile.role)) {
            toast({
                title: "Acceso Denegado",
                description: "No tienes permiso para acceder a esta página.",
                variant: "destructive",
            });
            router.push('/dashboard');
        }
    }, [user, isUserLoading, userProfile, isUserProfileLoading, router, toast]);

    useEffect(() => {
        if (roomsData) {
            const sortedRooms = [...roomsData].sort((a, b) => a.title.localeCompare(b.title, undefined, { numeric: true }));
            setEditableRooms(sortedRooms.map(room => ({ ...room, id: room.id, originalPrice: room.price, originalType: room.type, originalStatus: room.status, })));
        }
    }, [roomsData]);


    // --- Room Management ---
    const handleRoomChange = (id: string, field: keyof Room, value: string | number) => {
        setEditableRooms(prev => prev.map(room => room.id === id ? { ...room, [field]: value } : room));
    };

    const handleSaveChanges = () => {
        if (!firestore) return;
        setIsSavingRooms(true);
        const changedRooms = editableRooms.filter(room => room.price !== room.originalPrice || room.type !== room.originalType || room.status !== room.originalStatus);

        if (changedRooms.length === 0) {
            toast({ title: "Sin Cambios", description: "No se detectaron modificaciones para guardar." });
            setIsSavingRooms(false);
            return;
        }

        const updatePromises = changedRooms.map(room => {
            const roomDocRef = doc(firestore, 'rooms', room.id);
            const dataToUpdate = { price: room.price, type: room.type, status: room.status };
            return updateDocumentNonBlocking(roomDocRef, dataToUpdate);
        });

        Promise.all(updatePromises).then(() => {
            toast({ title: "Cambios Guardados", description: `Se han actualizado ${changedRooms.length} habitacion(es).` });
        }).catch((error) => {
            console.error("Error saving room changes:", error);
            toast({ title: "Error", description: "No se pudieron guardar todos los cambios.", variant: "destructive" });
        }).finally(() => {
            setIsSavingRooms(false);
        });
    };
    
    const onAddRoomSubmit = (values: z.infer<typeof newRoomSchema>) => {
        if (!firestore) return;
        const newRoomRef = doc(firestore, 'rooms', values.id);
        const newRoomData = { title: values.title, price: values.price, type: values.type, status: 'Disponible' };
        setDocumentNonBlocking(newRoomRef, newRoomData, { merge: false }).then(() => {
            toast({ title: "Habitación Agregada", description: `La habitación ${values.title} ha sido creada.` });
            setIsAddRoomDialogOpen(false);
            roomForm.reset();
        });
    };

    const handleDeleteRoom = (roomId: string) => {
        if (!firestore) return;
        deleteDocumentNonBlocking(doc(firestore, 'rooms', roomId)).then(() => {
            toast({ title: 'Habitación Eliminada', description: 'La habitación ha sido eliminada permanentemente.' });
        });
    };


    // --- Consumption Item Management ---
    const handleOpenConsumptionDialog = (item: ConsumptionItem | null) => {
        setEditingConsumptionItem(item);
        if (item) {
            consumptionForm.reset({ name: item.name, price: item.price, icon: item.icon });
        } else {
            consumptionForm.reset({ name: '', price: 0, icon: 'Package' });
        }
        setIsConsumptionDialogOpen(true);
    }
    
    const onConsumptionSubmit = (values: z.infer<typeof consumptionItemSchema>) => {
        if (!firestore) return;

        let promise;
        if (editingConsumptionItem) { // Update
            const itemDocRef = doc(firestore, 'consumption_items', editingConsumptionItem.id);
            promise = updateDocumentNonBlocking(itemDocRef, values).then(() => {
                toast({ title: "Consumo Actualizado", description: `Se ha actualizado ${values.name}.` });
            });
        } else { // Create
            const itemsColRef = collection(firestore, 'consumption_items');
            promise = addDocumentNonBlocking(itemsColRef, values).then(() => {
                toast({ title: "Consumo Agregado", description: `Se ha creado ${values.name}.` });
            });
        }
        
        promise.then(() => {
            setIsConsumptionDialogOpen(false);
            setEditingConsumptionItem(null);
        });
    };

    const handleDeleteConsumptionItem = (item: ConsumptionItem) => {
        if (!firestore) return;
        deleteDocumentNonBlocking(doc(firestore, 'consumption_items', item.id)).then(() => {
            toast({ title: 'Consumo Eliminado', description: `${item.name} ha sido eliminado.` });
        });
    };

    // --- Loading / Permissions ---
    if (isUserLoading || isUserProfileLoading) {
        return <div className="flex min-h-screen flex-col items-center justify-center bg-background p-8"><p>Cargando y verificando permisos...</p></div>;
    }
    if (!user || !userProfile || !['Admin', 'Socio'].includes(userProfile.role)) return null;
    
    const roomTypes = ["Unipersonal", "Matrimonial", "Doble", "Triple", "Quintuple", "Unipersonal con A/C", "Matrimonial con A/C"];
    const roomStatuses = ["Disponible", "Mantenimiento"];


    return (
        <div className="dark min-h-screen bg-background text-foreground p-4 pt-16 sm:p-6 lg:p-8">
            <header className="flex items-center gap-4 mb-8">
                 <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => router.back()}>
                    <ArrowLeft className="h-4 w-4" />
                    <span className="sr-only">Volver</span>
                </Button>
                <h1 className="text-2xl font-bold">Configuración</h1>
            </header>

            <main className="max-w-4xl mx-auto space-y-8">
                {/* Rooms Management Card */}
                <Card>
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <CardTitle>Administrar Habitaciones</CardTitle>
                             <Dialog open={isAddRoomDialogOpen} onOpenChange={setIsAddRoomDialogOpen}>
                                <DialogTrigger asChild><Button variant="outline"><PlusCircle className="mr-2 h-4 w-4" />Agregar Habitación</Button></DialogTrigger>
                                <DialogContent className="sm:max-w-md">
                                    <DialogHeader><DialogTitle>Agregar Nueva Habitación</DialogTitle><DialogDescription>Define los detalles de la nueva habitación. El ID debe ser único.</DialogDescription></DialogHeader>
                                    <Form {...roomForm}>
                                        <form onSubmit={roomForm.handleSubmit(onAddRoomSubmit)} className="space-y-4 pt-4">
                                            <FormField control={roomForm.control} name="id" render={({ field }) => (<FormItem><FormLabel>ID</FormLabel><FormControl><Input placeholder="Ej: 101" {...field} /></FormControl><FormMessage /></FormItem>)} />
                                            <FormField control={roomForm.control} name="title" render={({ field }) => (<FormItem><FormLabel>Nombre / Título</FormLabel><FormControl><Input placeholder="Ej: Habitación 101" {...field} /></FormControl><FormMessage /></FormItem>)} />
                                            <FormField control={roomForm.control} name="price" render={({ field }) => (<FormItem><FormLabel>Precio (C$)</FormLabel><FormControl><Input type="number" placeholder="Ej: 500" {...field} /></FormControl><FormMessage /></FormItem>)} />
                                            <FormField control={roomForm.control} name="type" render={({ field }) => (<FormItem><FormLabel>Tipo</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Seleccionar tipo" /></SelectTrigger></FormControl><SelectContent>{roomTypes.map(type => <SelectItem key={type} value={type}>{type}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>)} />
                                            <DialogFooter><Button type="submit">Crear Habitación</Button></DialogFooter>
                                        </form>
                                    </Form>
                                </DialogContent>
                            </Dialog>
                        </div>
                        <CardDescription>Ajusta el precio, tipo y estado de cada habitación.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        {roomsLoading ? <div className="space-y-4">{[...Array(3)].map((_, i) => <Skeleton key={i} className="h-20 w-full" />)}</div>
                        : <div className="space-y-4 max-h-[50vh] overflow-y-auto pr-2">{editableRooms.map((room) => (
                            <div key={room.id} className="grid grid-cols-1 sm:grid-cols-12 items-center gap-3 p-3 border rounded-lg">
                                <div className="sm:col-span-3"><Label htmlFor={`title-${room.id}`} className="font-semibold text-base">{room.title}</Label></div>
                                <div className="space-y-2 sm:col-span-2"><Label htmlFor={`price-${room.id}`}>Precio (C$)</Label><Input id={`price-${room.id}`} type="number" value={room.price} onChange={(e) => handleRoomChange(room.id, 'price', parseInt(e.target.value, 10) || 0)} /></div>
                                <div className="space-y-2 sm:col-span-3"><Label htmlFor={`type-${room.id}`}>Tipo</Label><Select value={room.type} onValueChange={(value) => handleRoomChange(room.id, 'type', value)}><SelectTrigger id={`type-${room.id}`}><SelectValue /></SelectTrigger><SelectContent>{roomTypes.map(type => <SelectItem key={type} value={type}>{type}</SelectItem>)}</SelectContent></Select></div>
                                <div className="space-y-2 sm:col-span-3"><Label htmlFor={`status-${room.id}`}>Estado</Label><Select value={room.status} onValueChange={(value) => handleRoomChange(room.id, 'status', value)}><SelectTrigger id={`status-${room.id}`}><SelectValue /></SelectTrigger><SelectContent>{roomStatuses.map(status => <SelectItem key={status} value={status}>{status}</SelectItem>)}</SelectContent></Select></div>
                                <div className="sm:col-span-1 flex justify-end">
                                    <AlertDialog><AlertDialogTrigger asChild><Button variant="ghost" size="icon"><Trash2 className="h-4 w-4 text-destructive" /></Button></AlertDialogTrigger>
                                        <AlertDialogContent><AlertDialogHeader><AlertDialogTitle>¿Eliminar habitación?</AlertDialogTitle><AlertDialogDescription>Esta acción es permanente. ¿Seguro que quieres eliminar {room.title}?</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Cancelar</AlertDialogCancel><AlertDialogAction className="bg-destructive hover:bg-destructive/90" onClick={() => handleDeleteRoom(room.id)}>Eliminar</AlertDialogAction></AlertDialogFooter></AlertDialogContent>
                                    </AlertDialog>
                                </div>
                            </div>))}
                        </div>}
                    </CardContent>
                    <CardContent className="flex justify-end"><Button onClick={handleSaveChanges} disabled={isSavingRooms}><Save className="mr-2 h-4 w-4" />{isSavingRooms ? 'Guardando...' : 'Guardar Cambios'}</Button></CardContent>
                </Card>

                {/* Consumption Items Management Card */}
                <Card>
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <CardTitle>Administrar Consumos Extras</CardTitle>
                            <Button variant="outline" onClick={() => handleOpenConsumptionDialog(null)}><PlusCircle className="mr-2 h-4 w-4" />Agregar Consumo</Button>
                        </div>
                        <CardDescription>Añade, edita o elimina los productos y servicios disponibles para los huéspedes.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        {consumptionItemsLoading ? <div className="space-y-2">{[...Array(3)].map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}</div>
                        : <div className="space-y-2 max-h-[50vh] overflow-y-auto pr-2">{consumptionItemsData?.map((item) => (
                            <div key={item.id} className="grid grid-cols-12 items-center gap-4 p-2 border rounded-lg">
                                <div className="col-span-1 flex items-center justify-center text-muted-foreground">
                                    {availableIcons[item.icon] || <Package className="h-5 w-5"/>}
                                </div>
                                <div className="col-span-5 font-medium">{item.name}</div>
                                <div className="col-span-3 flex items-center"><DollarSign className="h-4 w-4 mr-1 text-muted-foreground"/>{item.price.toFixed(2)}</div>
                                <div className="col-span-3 flex justify-end gap-1">
                                    <Button variant="ghost" size="icon" onClick={() => handleOpenConsumptionDialog(item as ConsumptionItem)}><Edit className="h-4 w-4"/></Button>
                                    <AlertDialog>
                                        <AlertDialogTrigger asChild><Button variant="ghost" size="icon"><Trash2 className="h-4 w-4 text-destructive"/></Button></AlertDialogTrigger>
                                        <AlertDialogContent><AlertDialogHeader><AlertDialogTitle>¿Eliminar Consumo?</AlertDialogTitle><AlertDialogDescription>Esta acción es permanente. ¿Seguro que quieres eliminar {item.name}?</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Cancelar</AlertDialogCancel><AlertDialogAction className="bg-destructive hover:bg-destructive/90" onClick={() => handleDeleteConsumptionItem(item as ConsumptionItem)}>Eliminar</AlertDialogAction></AlertDialogFooter></AlertDialogContent>
                                    </AlertDialog>
                                </div>
                            </div>
                            ))}
                        </div>}
                    </CardContent>
                </Card>
            </main>

            {/* Consumption Item Add/Edit Dialog */}
            <Dialog open={isConsumptionDialogOpen} onOpenChange={setIsConsumptionDialogOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>{editingConsumptionItem ? 'Editar' : 'Agregar'} Consumo</DialogTitle>
                        <DialogDescription>Completa los detalles del producto o servicio.</DialogDescription>
                    </DialogHeader>
                    <Form {...consumptionForm}>
                        <form onSubmit={consumptionForm.handleSubmit(onConsumptionSubmit)} className="space-y-4 pt-4">
                            <FormField control={consumptionForm.control} name="name" render={({ field }) => (<FormItem><FormLabel>Nombre</FormLabel><FormControl><Input placeholder="Ej: Gaseosa" {...field} /></FormControl><FormMessage /></FormItem>)} />
                            <FormField control={consumptionForm.control} name="price" render={({ field }) => (<FormItem><FormLabel>Precio (C$)</FormLabel><FormControl><Input type="number" placeholder="Ej: 30" {...field} /></FormControl><FormMessage /></FormItem>)} />
                            <FormField
                                control={consumptionForm.control}
                                name="icon"
                                render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Ícono</FormLabel>
                                    <Select onValueChange={field.onChange} value={field.value}>
                                    <FormControl>
                                        <SelectTrigger>
                                        <SelectValue placeholder="Seleccionar un ícono" />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        {Object.entries(availableIcons).map(([name, IconComponent]) => (
                                        <SelectItem key={name} value={name}>
                                            <div className="flex items-center gap-3">
                                            {React.cloneElement(IconComponent as React.ReactElement, { className: "h-5 w-5"})}
                                            <span>{name}</span>
                                            </div>
                                        </SelectItem>
                                        ))}
                                    </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                                )}
                            />
                            <DialogFooter>
                                <Button type="button" variant="outline" onClick={() => setIsConsumptionDialogOpen(false)}>Cancelar</Button>
                                <Button type="submit">{editingConsumptionItem ? 'Guardar Cambios' : 'Crear Consumo'}</Button>
                            </DialogFooter>
                        </form>
                    </Form>
                </DialogContent>
            </Dialog>
        </div>
    );
}
