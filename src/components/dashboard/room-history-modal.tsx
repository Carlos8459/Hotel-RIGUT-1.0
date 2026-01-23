import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";

type Room = {
    id: number;
    title: string;
    history?: {
        name: string;
        date: string;
        avatar: string;
    }[];
}

type RoomHistoryModalProps = {
    room: Room;
    isOpen: boolean;
    onClose: () => void;
}

export function RoomHistoryModal({ room, isOpen, onClose }: RoomHistoryModalProps) {
  if (!room) return null;

  const weeklyHistory = room.history || [];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-card text-foreground max-w-sm border-border rounded-3xl">
        <DialogHeader>
          <DialogTitle>Historial de {room.title}</DialogTitle>
          <DialogDescription>
            Mostrando el historial completo de la habitación.
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="max-h-[60vh] -mx-6 px-6">
          <div className="space-y-4 py-4">
            {weeklyHistory.length > 0 ? (
                weeklyHistory.map((pastGuest, index) => (
                    <div key={index}>
                        <div className="flex items-center">
                            <Avatar className="h-9 w-9 mr-4">
                            <AvatarFallback>{pastGuest.avatar}</AvatarFallback>
                            </Avatar>
                            <div>
                            <p className="font-semibold">{pastGuest.name}</p>
                            <p className="text-sm text-muted-foreground">{pastGuest.date}</p>
                            </div>
                        </div>
                        {index < weeklyHistory.length - 1 && <Separator className="mt-4" />}
                    </div>
                ))
            ) : (
                <p className="text-sm text-muted-foreground text-center py-8">
                    No hay historial para esta habitación.
                </p>
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
