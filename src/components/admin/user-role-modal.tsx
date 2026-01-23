'use client';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { useFirestore, useDoc, useUser, setDocumentNonBlocking, deleteDocumentNonBlocking, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import type { UserProfile } from './user-list';
import { useToast } from "@/hooks/use-toast";

interface UserRoleModalProps {
    user: UserProfile;
    isOpen: boolean;
    onClose: () => void;
}

export function UserRoleModal({ user, isOpen, onClose }: UserRoleModalProps) {
    const firestore = useFirestore();
    const { toast } = useToast();
    const { user: currentUser } = useUser();

    const adminRoleRef = useMemoFirebase(() => {
        if (!firestore || !user) return null;
        return doc(firestore, 'roles_admin', user.id);
    }, [firestore, user]);

    const { data: adminRole, isLoading } = useDoc<{isAdmin?: boolean}>(adminRoleRef);

    const isUserAdmin = adminRole?.isAdmin === true;
    const isSelf = currentUser?.uid === user.id;

    const handleRoleChange = (isNowAdmin: boolean) => {
         if (!firestore) return;
         if (isSelf) {
             toast({ variant: "destructive", title: "Acción no permitida", description: "No puedes quitarte tus propios permisos de administrador." });
             return;
         }

         const roleRef = doc(firestore, "roles_admin", user.id);

         if (isNowAdmin) {
             setDocumentNonBlocking(roleRef, { isAdmin: true }, { merge: true });
             toast({ title: "Permisos actualizados", description: `${user.username} ahora es administrador.` });
         } else {
             deleteDocumentNonBlocking(roleRef);
             toast({ title: "Permisos actualizados", description: `${user.username} ya no es administrador.` });
         }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Gestionar Permisos</DialogTitle>
                    <DialogDescription>
                        Configura los accesos para {user.username} ({user.email}).
                    </DialogDescription>
                </DialogHeader>
                <div className="py-4">
                    <div className="flex items-center space-x-4 rounded-md border p-4">
                        <div className="flex-1 space-y-1">
                            <p className="text-sm font-medium leading-none">
                                Administrador
                            </p>
                            <p className="text-sm text-muted-foreground">
                                Concede acceso total para gestionar la aplicación.
                            </p>
                        </div>
                        <Switch
                            id="admin-mode"
                            checked={isUserAdmin}
                            onCheckedChange={handleRoleChange}
                            disabled={isLoading || isSelf}
                            aria-label="Modo administrador"
                        />
                    </div>
                     {isSelf && <p className="text-xs text-muted-foreground pt-2 px-1">No puedes modificar tus propios permisos de administrador.</p>}
                </div>
                <DialogFooter>
                    <Button onClick={onClose}>Cerrar</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
