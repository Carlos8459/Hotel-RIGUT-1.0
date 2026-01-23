'use client';
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { UserRoleModal } from './user-role-modal';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';

export interface UserProfile {
    id: string;
    username: string;
    email: string;
    registrationDate: string;
}

interface UserListProps {
    users: UserProfile[] | null;
    isLoading: boolean;
    error: Error | null;
}

export function UserList({ users, isLoading, error }: UserListProps) {
    const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);

    if (isLoading) {
        return (
             <Card>
                <CardHeader>
                    <Skeleton className="h-6 w-48" />
                    <Skeleton className="h-4 w-full max-w-lg mt-2" />
                </CardHeader>
                <CardContent className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {Array.from({ length: 6 }).map((_, i) => (
                        <Card key={i}><CardContent className="p-4 flex items-center gap-4"><Skeleton className="h-12 w-12 rounded-full" /><div className="space-y-2"><Skeleton className="h-4 w-24" /><Skeleton className="h-4 w-40" /></div></CardContent></Card>
                    ))}
                </CardContent>
            </Card>
        );
    }

    if (error) {
         return (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error al cargar usuarios</AlertTitle>
              <AlertDescription>
                No se pudieron cargar los datos de los usuarios. Es posible que no tengas los permisos necesarios.
                <p className="text-xs mt-2 font-mono">{error.message}</p>
              </AlertDescription>
            </Alert>
          )
    }

    return (
        <>
            <Card>
                <CardHeader>
                    <CardTitle>Usuarios Registrados</CardTitle>
                    <CardDescription>Haz clic en un usuario para ver sus detalles y gestionar sus permisos.</CardDescription>
                </CardHeader>
                <CardContent className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {users && users.length > 0 ? users.map(user => (
                        <Card 
                            key={user.id} 
                            className="cursor-pointer hover:border-primary transition-colors"
                            onClick={() => setSelectedUser(user)}
                        >
                            <CardContent className="p-4 flex items-center gap-4">
                                <Avatar className="h-12 w-12">
                                    <AvatarFallback>{user.username?.charAt(0).toUpperCase() || user.email?.charAt(0).toUpperCase()}</AvatarFallback>
                                </Avatar>
                                <div className="overflow-hidden">
                                    <p className="font-bold truncate">{user.username || 'Sin nombre'}</p>
                                    <p className="text-sm text-muted-foreground truncate">{user.email}</p>
                                </div>
                            </CardContent>
                        </Card>
                    )) : (
                        <p className="text-muted-foreground col-span-full text-center p-8">No se encontraron usuarios.</p>
                    )}
                </CardContent>
            </Card>
            {selectedUser && (
                <UserRoleModal 
                    user={selectedUser}
                    isOpen={!!selectedUser}
                    onClose={() => setSelectedUser(null)}
                />
            )}
        </>
    );
}
