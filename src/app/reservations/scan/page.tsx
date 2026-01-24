'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { useFirestore, setDocumentNonBlocking } from '@/firebase';
import { doc } from 'firebase/firestore';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Camera, ArrowLeft, LoaderCircle, AlertCircle, User, Fingerprint, Sparkles } from 'lucide-react';
import { IdCardOverlay } from '@/components/ui/id-card-overlay';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from '@/components/ui/input';
import { scanIdCard } from '@/ai/flows/scan-id-card-flow';

const customerSchema = z.object({
  guestName: z.string().min(3, { message: 'El nombre debe tener al menos 3 caracteres.' }),
  cedula: z.string().min(1, { message: 'La cédula es obligatoria.' }),
});

export default function ScanIdPage() {
    const router = useRouter();
    const { toast } = useToast();
    const firestore = useFirestore();

    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);

    const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
    const [isScanning, setIsScanning] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [cameraError, setCameraError] = useState<string | null>(null);
    const [capturedPhotoUri, setCapturedPhotoUri] = useState<string | null>(null);

    const form = useForm<z.infer<typeof customerSchema>>({
        resolver: zodResolver(customerSchema),
        defaultValues: { guestName: '', cedula: '' },
    });

    useEffect(() => {
        const getCameraPermission = async () => {
            if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
                setCameraError('Tu navegador no soporta el acceso a la cámara.');
                setHasCameraPermission(false);
                return;
            }
            try {
                const stream = await navigator.mediaDevices.getUserMedia({
                    video: { facingMode: 'environment' } // Prefer back camera
                });
                setHasCameraPermission(true);
                if (videoRef.current) {
                    videoRef.current.srcObject = stream;
                }
            } catch (err) {
                console.error('Error accessing camera:', err);
                setCameraError('Permiso de cámara denegado. Por favor, habilita el acceso en tu navegador.');
                setHasCameraPermission(false);
            }
        };
        getCameraPermission();

        return () => {
            // Cleanup: stop video stream when component unmounts
            if (videoRef.current && videoRef.current.srcObject) {
                const stream = videoRef.current.srcObject as MediaStream;
                stream.getTracks().forEach(track => track.stop());
            }
        };
    }, []);

    const handleScan = async () => {
        if (!videoRef.current || !canvasRef.current) {
             toast({ variant: 'destructive', title: 'Error', description: 'El componente de la cámara no está listo.' });
            return;
        }
        setIsScanning(true);
        toast({ title: 'Escaneando...', description: 'Analizando la imagen de la cédula.' });

        const video = videoRef.current;
        const canvas = canvasRef.current;
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const context = canvas.getContext('2d');

        if (!context) {
            setIsScanning(false);
            toast({ variant: 'destructive', title: 'Error', description: 'No se pudo procesar la imagen.' });
            return;
        }

        context.drawImage(video, 0, 0, video.videoWidth, video.videoHeight);
        const photoDataUri = canvas.toDataURL('image/jpeg', 0.9);
        setCapturedPhotoUri(photoDataUri);

        try {
            const result = await scanIdCard({ photoDataUri });
            if (result && result.fullName && result.idNumber) {
                form.setValue('guestName', result.fullName);
                form.setValue('cedula', result.idNumber);
                toast({ title: '¡Datos extraídos!', description: 'Verifica la información antes de guardar.' });
            } else {
                throw new Error('No se pudo extraer la información.');
            }
        } catch (error: any) {
            console.error("Scan failed:", error);
            toast({
                variant: 'destructive',
                title: 'Error de Escaneo',
                description: error.message || 'No se pudo leer la información de la cédula. Inténtalo de nuevo.',
            });
        } finally {
            setIsScanning(false);
        }
    };


    const onSubmit = async (values: z.infer<typeof customerSchema>) => {
        if (!capturedPhotoUri) {
            toast({
                variant: 'destructive',
                title: 'Error',
                description: 'Primero debes escanear la cédula para capturar una foto.',
            });
            return;
        }
        if (!firestore) {
            toast({ variant: 'destructive', title: 'Error', description: 'La base de datos no está disponible.' });
            return;
        }

        setIsSaving(true);

        try {
            const customerId = values.cedula.replace(/[^a-zA-Z0-9]/g, ''); // Sanitize ID for document key
            const customerDocRef = doc(firestore, 'customers', customerId);

            setDocumentNonBlocking(customerDocRef, {
                guestName: values.guestName,
                cedula: values.cedula,
                idCardImage: capturedPhotoUri,
                createdAt: new Date().toISOString()
            }, { merge: true });

            toast({
                title: '¡Éxito!',
                description: `Datos de ${values.guestName} guardados. Redirigiendo...`,
            });
            
            router.push(`/new-reservation?guestName=${encodeURIComponent(values.guestName)}&cedula=${encodeURIComponent(values.cedula)}`);

        } catch (err: any) {
            console.error("Save failed:", err);
            toast({
                variant: 'destructive',
                title: 'Error al Guardar',
                description: err.message || 'No se pudo guardar la información del cliente.',
            });
            setIsSaving(false);
        }
    };


    return (
        <div className="dark min-h-screen bg-background text-foreground flex flex-col">
            <header className="flex items-center gap-4 p-4 border-b">
                <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => router.back()}>
                    <ArrowLeft className="h-4 w-4" />
                    <span className="sr-only">Volver</span>
                </Button>
                <h1 className="text-xl font-bold">Escanear Cédula</h1>
            </header>
            
            <main className="flex-grow flex flex-col items-center justify-center p-4 space-y-4">
                <div className="w-full max-w-lg aspect-[16/10] bg-black rounded-lg overflow-hidden relative flex items-center justify-center">
                    <video ref={videoRef} className="w-full h-full object-cover" autoPlay muted playsInline />
                    <IdCardOverlay />
                    {hasCameraPermission === false && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 text-white p-4 text-center">
                            <AlertCircle className="h-10 w-10 mb-4" />
                            <h2 className="text-lg font-semibold">Error de Cámara</h2>
                            <p className="text-sm">{cameraError || "No se pudo acceder a la cámara."}</p>
                        </div>
                    )}
                </div>

                <div className="w-full max-w-lg">
                    <Button
                        onClick={handleScan}
                        disabled={isScanning || hasCameraPermission !== true}
                        size="lg"
                        className="w-full mb-4"
                        variant="outline"
                    >
                        {isScanning ? (
                            <>
                                <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
                                Escaneando...
                            </>
                        ) : (
                            <>
                                <Sparkles className="mr-2 h-4 w-4" />
                                Rellenar con IA
                            </>
                        )}
                    </Button>
                </div>


                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 w-full max-w-lg">
                        <FormField
                            control={form.control}
                            name="guestName"
                            render={({ field }) => (
                                <FormItem>
                                <FormLabel>Nombre del Huésped</FormLabel>
                                <div className="relative flex items-center">
                                    <User className="absolute left-3 h-5 w-5 text-muted-foreground" />
                                    <FormControl>
                                    <Input placeholder="Extraído de la cédula..." {...field} className="pl-10" />
                                    </FormControl>
                                </div>
                                <FormMessage />
                                </FormItem>
                            )}
                        />
                         <FormField
                            control={form.control}
                            name="cedula"
                            render={({ field }) => (
                                <FormItem>
                                <FormLabel>Cédula</FormLabel>
                                <div className="relative flex items-center">
                                    <Fingerprint className="absolute left-3 h-5 w-5 text-muted-foreground" />
                                    <FormControl>
                                    <Input placeholder="Extraído de la cédula..." {...field} className="pl-10" />
                                    </FormControl>
                                </div>
                                <FormMessage />
                                </FormItem>
                            )}
                        />
                        <Button
                            type="submit"
                            disabled={isSaving || isScanning || !capturedPhotoUri}
                            size="lg"
                            className="w-full"
                        >
                            {isSaving ? (
                                <>
                                    <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
                                    Guardando...
                                </>
                            ) : (
                                <>
                                    <Camera className="mr-2 h-4 w-4" />
                                    Guardar y Continuar
                                </>
                            )}
                        </Button>
                    </form>
                </Form>
                
                <canvas ref={canvasRef} className="hidden"></canvas>
            </main>
        </div>
    );
}
